import fs from "node:fs";
import path from "node:path";

import { parseServerAddress } from "../../shared/address";
import { renderGeyserConfig } from "./geyserConfig";
import { logLooksReady, type GeyserLauncher } from "./launcher";
import { resolveJavaTarget } from "./resolveTarget";

export type SessionStatus = "starting" | "ready" | "failed" | "stopped";

export type Session = {
  id: string;
  name: string;
  targetHost: string;
  targetPort: number;
  authMode: "online" | "offline";
  relayHost: string;
  relayPort: number | null;
  webrtcPort: number | null;
  status: SessionStatus;
  error: string | null;
  createdAt: string;
  expiresAt: string;
};

export type CreateSessionInput = {
  name?: unknown;
  host?: unknown;
  port?: unknown;
  authMode?: unknown;
};

type ResolvedTarget = { host: string; port: number };

export class PortAllocator {
  private used = new Set<number>();

  constructor(
    private start: number,
    private end: number,
  ) {}

  allocate(): { bedrock: number; webrtc: number } | null {
    const first = this.start % 2 === 0 ? this.start : this.start + 1;
    for (let port = first; port + 1 <= this.end; port += 2) {
      if (!this.used.has(port) && !this.used.has(port + 1)) {
        this.used.add(port);
        this.used.add(port + 1);
        return { bedrock: port, webrtc: port + 1 };
      }
    }
    return null;
  }

  release(bedrock: number | null, webrtc: number | null): void {
    if (bedrock != null) {
      this.used.delete(bedrock);
    }
    if (webrtc != null) {
      this.used.delete(webrtc);
    }
  }
}

function sessionId(): string {
  return `s_${Math.random().toString(16).slice(2, 10)}${Date.now().toString(16).slice(-4)}`;
}

function cleanName(value: unknown, fallback: string): string {
  const raw = typeof value === "string" ? value : fallback;
  const cleaned = raw.replace(/[^\w .'-]+/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, 32);
}

export class SessionManager {
  private sessions = new Map<string, Session>();
  private inflight = new Map<string, Promise<void>>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private opts: {
      launcher: GeyserLauncher;
      ports: PortAllocator;
      publicHost: string;
      dataDir: string;
      ttlMs: number;
      maxSessions: number;
      readyTimeoutMs: number;
      pollMs?: number;
      resolveTarget?: (host: string, port: number | null) => Promise<ResolvedTarget>;
      now?: () => number;
    },
  ) {}

  startReaper(): void {
    this.timer = setInterval(() => {
      void this.expire();
    }, 30_000);
    this.timer.unref?.();
  }

  stopReaper(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  list(): Session[] {
    return [...this.sessions.values()];
  }

  activeCount(): number {
    return this.list().filter((session) => session.status === "starting" || session.status === "ready").length;
  }

  get(id: string): Session | null {
    return this.sessions.get(id) ?? null;
  }

  keepAlive(id: string): void {
    const session = this.sessions.get(id);
    if (!session) {
      return;
    }
    if (session.status === "ready" || session.status === "starting") {
      session.expiresAt = new Date(this.now() + this.opts.ttlMs).toISOString();
    }
  }

  async settle(id: string): Promise<Session | null> {
    await this.inflight.get(id);
    return this.get(id);
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const host = typeof input.host === "string" ? input.host.trim() : "";
    const port = input.port == null || input.port === "" ? null : input.port;
    const parsed = parseServerAddress(port == null ? host : joinHost(host, port));
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }
    const authMode = input.authMode === "offline" ? "offline" : input.authMode == null || input.authMode === "online" ? "online" : null;
    if (!authMode) {
      throw new Error("Auth mode must be online or offline.");
    }

    const target = await this.resolve(parsed.address.host, parsed.address.port);
    const existing = this.list().find(
      (session) =>
        (session.status === "starting" || session.status === "ready") &&
        session.targetHost === target.host &&
        session.targetPort === target.port &&
        session.authMode === authMode,
    );
    if (existing) {
      existing.expiresAt = new Date(this.now() + this.opts.ttlMs).toISOString();
      return existing;
    }
    if (this.activeCount() >= this.opts.maxSessions) {
      throw new Error("The relay is at its session limit. Try again in a few minutes.");
    }

    const ports = this.opts.ports.allocate();
    if (!ports) {
      throw new Error("No free Bedrock ports are left on the relay.");
    }

    const now = this.now();
    const session: Session = {
      id: sessionId(),
      name: cleanName(input.name, target.host),
      targetHost: target.host,
      targetPort: target.port,
      authMode,
      relayHost: this.opts.publicHost,
      relayPort: ports.bedrock,
      webrtcPort: ports.webrtc,
      status: "starting",
      error: null,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.opts.ttlMs).toISOString(),
    };
    this.sessions.set(session.id, session);

    const boot = this.boot(session, ports).catch((error: unknown) => {
      session.status = "failed";
      session.error = error instanceof Error ? error.message : "Geyser failed to start.";
    });
    this.inflight.set(session.id, boot);
    return session;
  }

  async stop(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) {
      return null;
    }
    await this.opts.launcher.stop(id);
    session.status = "stopped";
    this.opts.ports.release(session.relayPort, session.webrtcPort);
    session.relayPort = null;
    session.webrtcPort = null;
    return session;
  }

  async expire(): Promise<void> {
    const now = this.now();
    for (const session of this.list()) {
      if ((session.status === "ready" || session.status === "starting") && Date.parse(session.expiresAt) <= now) {
        await this.stop(session.id);
      }
    }
  }

  private now(): number {
    return this.opts.now ? this.opts.now() : Date.now();
  }

  private async resolve(host: string, port: number | null): Promise<ResolvedTarget> {
    if (this.opts.resolveTarget) {
      return this.opts.resolveTarget(host, port);
    }
    return resolveJavaTarget(host, port);
  }

  private async boot(session: Session, ports: { bedrock: number; webrtc: number }): Promise<void> {
    const configDir = path.join(this.opts.dataDir, "sessions", session.id);
    fs.mkdirSync(configDir, { recursive: true });
    const yaml = renderGeyserConfig({
      javaHost: session.targetHost,
      javaPort: session.targetPort,
      bedrockPort: ports.bedrock,
      webrtcPort: ports.webrtc,
      authMode: session.authMode,
      serverName: session.name,
      publicHost: this.opts.publicHost,
    });
    fs.writeFileSync(path.join(configDir, "config.yml"), yaml);

    try {
      await this.opts.launcher.start({
        id: session.id,
        configDir,
        bedrockPort: ports.bedrock,
        webrtcPort: ports.webrtc,
      });
    } catch (error) {
      session.status = "failed";
      session.error = error instanceof Error ? error.message : "Geyser failed to start.";
      this.opts.ports.release(ports.bedrock, ports.webrtc);
      return;
    }

    const deadline = this.now() + this.opts.readyTimeoutMs;
    const poll = this.opts.pollMs ?? 500;
    while (this.now() < deadline) {
      if (session.status === "stopped") {
        return;
      }
      const running = await this.opts.launcher.running(session.id);
      const logs = await this.opts.launcher.logs(session.id);
      if (!running) {
        session.status = "failed";
        session.error = tail(logs) || "Geyser exited before it was ready.";
        this.opts.ports.release(ports.bedrock, ports.webrtc);
        return;
      }
      if (logLooksReady(logs) || (await this.opts.launcher.probe(ports.bedrock))) {
        session.status = "ready";
        session.error = null;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, poll));
    }

    session.status = "failed";
    session.error = "Timed out waiting for Geyser to open its Bedrock port.";
    await this.opts.launcher.stop(session.id);
    this.opts.ports.release(ports.bedrock, ports.webrtc);
  }
}

function joinHost(host: string, port: unknown): string {
  const portText = String(port);
  if (host.includes(":") && !host.startsWith("[")) {
    return `[${host}]:${portText}`;
  }
  return `${host}:${portText}`;
}

function tail(logs: string): string {
  const lines = logs
    .split(/\r?\n/)
    .map((line) => line.replace(/\u001b\[[0-9;]*m/g, "").trim())
    .filter(Boolean);
  const errors = lines.filter((line) => /error|exception|unable/i.test(line));
  const picked = (errors.length > 0 ? errors : lines).slice(-3);
  return picked.join(" ").slice(0, 500);
}
