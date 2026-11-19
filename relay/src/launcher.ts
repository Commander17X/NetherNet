import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

export type LaunchSpec = {
  id: string;
  configDir: string;
  bedrockPort: number;
  webrtcPort: number;
};

export interface GeyserLauncher {
  start(spec: LaunchSpec): Promise<void>;
  stop(id: string): Promise<void>;
  running(id: string): Promise<boolean>;
  logs(id: string): Promise<string>;
  probe(port: number): Promise<boolean>;
}

const READY_LOG = /started geyser|listening on|geyser has started/i;

export function logLooksReady(logs: string): boolean {
  return READY_LOG.test(logs);
}

export function probePort(port: number, host = "127.0.0.1", timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

export class ProcessLauncher implements GeyserLauncher {
  private processes = new Map<string, ChildProcess>();
  private output = new Map<string, string>();

  constructor(
    private javaBin: string,
    private jarPath: string,
  ) {}

  async start(spec: LaunchSpec): Promise<void> {
    if (!fs.existsSync(this.jarPath)) {
      throw new Error(`Geyser jar not found at ${this.jarPath}`);
    }
    fs.mkdirSync(spec.configDir, { recursive: true });
    const child = spawn(this.javaBin, ["-Xms128M", "-Xmx512M", "-jar", this.jarPath, "--nogui"], {
      cwd: spec.configDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.processes.set(spec.id, child);
    this.output.set(spec.id, "");
    if (child.pid) {
      fs.writeFileSync(path.join(spec.configDir, "pid"), String(child.pid));
    }
    const append = (chunk: Buffer) => {
      const next = `${this.output.get(spec.id) ?? ""}${chunk.toString("utf8")}`;
      this.output.set(spec.id, next.slice(-200_000));
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", append);
    child.on("exit", () => {
      this.processes.delete(spec.id);
    });
    if (!child.pid) {
      throw new Error("Java did not start.");
    }
  }

  async stop(id: string): Promise<void> {
    const child = this.processes.get(id);
    if (!child || child.killed || child.exitCode !== null) {
      this.processes.delete(id);
      return;
    }
    child.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (child.exitCode === null && !child.killed) {
      child.kill("SIGKILL");
    }
    this.processes.delete(id);
  }

  async running(id: string): Promise<boolean> {
    const child = this.processes.get(id);
    return Boolean(child && child.exitCode === null && !child.killed);
  }

  async logs(id: string): Promise<string> {
    return this.output.get(id) ?? "";
  }

  async probe(port: number): Promise<boolean> {
    return probePort(port);
  }
}

export function reapOrphanPids(dataDir: string): void {
  const root = path.join(dataDir, "sessions");
  if (!fs.existsSync(root)) {
    return;
  }
  for (const entry of fs.readdirSync(root)) {
    const pidFile = path.join(root, entry, "pid");
    if (!fs.existsSync(pidFile)) {
      continue;
    }
    const pid = Number(fs.readFileSync(pidFile, "utf8").trim());
    if (!Number.isInteger(pid) || pid <= 0) {
      continue;
    }
    let cmdline = "";
    try {
      cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8");
    } catch {
      continue;
    }
    if (!/geyser/i.test(cmdline)) {
      continue;
    }
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // The process was already gone.
    }
  }
}
