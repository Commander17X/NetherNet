import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import type { AddressInfo } from "node:net";

import { renderGeyserConfig } from "../src/geyserConfig";
import { resolveJavaTarget } from "../src/resolveTarget";
import type { GeyserLauncher, LaunchSpec } from "../src/launcher";
import { loadPublicServers } from "../src/publicServers";
import { createRelayServer } from "../src/server";
import { PortAllocator, SessionManager, type Session } from "../src/sessions";

class FakeLauncher implements GeyserLauncher {
  started: LaunchSpec[] = [];
  stopped: string[] = [];
  alive = true;
  text = "INFO Started Geyser on 0.0.0.0:19132\n";

  async start(spec: LaunchSpec): Promise<void> {
    this.started.push(spec);
  }

  async stop(id: string): Promise<void> {
    this.stopped.push(id);
    this.alive = false;
  }

  async running(): Promise<boolean> {
    return this.alive;
  }

  async logs(): Promise<string> {
    return this.text;
  }

  async probe(): Promise<boolean> {
    return false;
  }
}

function manager(launcher: FakeLauncher, dataDir: string, maxSessions = 4): SessionManager {
  return new SessionManager({
    launcher,
    ports: new PortAllocator(19132, 19137),
    publicHost: "relay.example.com",
    dataDir,
    ttlMs: 60_000,
    maxSessions,
    readyTimeoutMs: 1_000,
    pollMs: 5,
    resolveTarget: async (host, port) => ({ host, port: port ?? 2788 }),
  });
}

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as AddressInfo;
  return address.port;
}

describe("java target", () => {
  it("keeps a port the caller already chose", async () => {
    await expect(resolveJavaTarget("play.example.com", 25570)).resolves.toEqual({
      host: "play.example.com",
      port: 25570,
    });
  });
});

describe("geyser config", () => {
  it("points Geyser at the Java server and keeps auth online or offline", () => {
    const online = renderGeyserConfig({
      javaHost: "play.trix-islands.gg",
      javaPort: 2788,
      bedrockPort: 19132,
      webrtcPort: 19133,
      authMode: "online",
      serverName: "Trix Islands",
      publicHost: "relay.example.com",
    });
    expect(online).toContain('address: "play.trix-islands.gg"');
    expect(online).toContain("port: 2788");
    expect(online).toContain("auth-type: online");
    expect(online).toContain("transport: both");
    expect(online).toContain('advertise-addresses:');
    expect(online).toContain("relay.example.com:19133");
    expect(online).not.toContain("auth-type: floodgate");

    const offline = renderGeyserConfig({
      javaHost: "10.0.0.4",
      javaPort: 25565,
      bedrockPort: 19140,
      webrtcPort: 19141,
      authMode: "offline",
      serverName: 'Bob "the" builder',
      publicHost: "::1",
    });
    expect(offline).toContain("auth-type: offline");
    expect(offline).toContain('address: "10.0.0.4"');
    expect(offline).toContain("[::1]:19141");
    expect(offline).not.toContain("auth-type: floodgate");
  });
});

describe("sessions", () => {
  it("starts a session and marks it ready when Geyser logs that it is up", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nethernet-"));
    const launcher = new FakeLauncher();
    const sessions = manager(launcher, dir);
    const created = await sessions.create({
      name: "Trix Islands",
      host: "play.trix-islands.gg",
      port: null,
      authMode: "online",
    });
    expect(created.status).toBe("starting");
    const settled = await sessions.settle(created.id);
    expect(settled?.status).toBe("ready");
    expect(settled?.targetPort).toBe(2788);
    expect(settled?.relayHost).toBe("relay.example.com");
    expect(settled?.relayPort).toBe(19132);
    const yaml = fs.readFileSync(path.join(dir, "sessions", created.id, "config.yml"), "utf8");
    expect(yaml).toContain("play.trix-islands.gg");
    expect(yaml).toContain("auth-type: online");

    const again = await sessions.create({ host: "play.trix-islands.gg", authMode: "online" });
    expect(again.id).toBe(created.id);
  });

  it("records a failure when Geyser exits immediately", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nethernet-"));
    const launcher = new FakeLauncher();
    launcher.alive = false;
    launcher.text = "Unable to bind to port";
    const sessions = manager(launcher, dir);
    const created = await sessions.create({ host: "play.example.com", port: 25565 });
    const settled = await sessions.settle(created.id);
    expect(settled?.status).toBe("failed");
    expect(settled?.error).toContain("Unable to bind");
  });

  it("rejects a bad address and stops at the session cap", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nethernet-"));
    const sessions = manager(new FakeLauncher(), dir, 1);
    await expect(sessions.create({ host: "not a host" })).rejects.toThrow(/hostname/i);
    const first = await sessions.create({ host: "one.example.com", port: 25565 });
    await sessions.settle(first.id);
    await expect(sessions.create({ host: "two.example.com", port: 25565 })).rejects.toThrow(/session limit/i);
  });
});

describe("http api", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nethernet-api-"));
  const launcher = new FakeLauncher();
  const sessions = manager(launcher, dir);
  const publicFile = path.join(__dirname, "..", "config", "public-servers.json");
  const servers = loadPublicServers(publicFile);
  let port = 0;
  let httpServer: http.Server;

  beforeAll(async () => {
    httpServer = createRelayServer({
      sessions,
      publicServers: servers,
      token: "secret",
      health: () => ({
        ok: true,
        geyser: "ready",
        java: "ready",
        sessions: sessions.activeCount(),
        publicHost: "relay.example.com",
      }),
    });
    port = await listen(httpServer);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => httpServer.close((error) => (error ? reject(error) : resolve())));
  });

  it("serves health without a token and hides servers without one", async () => {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toMatchObject({ ok: true, publicHost: "relay.example.com" });

    const hidden = await fetch(`http://127.0.0.1:${port}/servers`);
    expect(hidden.status).toBe(401);

    const listed = await fetch(`http://127.0.0.1:${port}/servers`, {
      headers: { authorization: "Bearer secret" },
    });
    const body = (await listed.json()) as { servers: { host: string; featured: boolean }[] };
    expect(body.servers.some((server) => server.host === "play.trix-islands.gg" && server.featured)).toBe(true);
  });

  it("opens a session and reports it ready", async () => {
    const createdResponse = await fetch(`http://127.0.0.1:${port}/sessions`, {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ name: "Lobby", host: "lobby.example.com", port: 25570, authMode: "offline" }),
    });
    expect(createdResponse.status).toBe(202);
    const created = (await createdResponse.json()) as Session;
    const settled = await sessions.settle(created.id);
    expect(settled?.status).toBe("ready");
    expect(settled?.authMode).toBe("offline");

    const statusResponse = await fetch(`http://127.0.0.1:${port}/sessions/${created.id}`, {
      headers: { authorization: "Bearer secret" },
    });
    const status = (await statusResponse.json()) as Session;
    expect(status.status).toBe("ready");
    expect(status.relayPort).toBeGreaterThan(0);

    const removed = await fetch(`http://127.0.0.1:${port}/sessions/${created.id}`, {
      method: "DELETE",
      headers: { authorization: "Bearer secret" },
    });
    expect(removed.status).toBe(200);
    await expect(removed.json()).resolves.toMatchObject({ status: "stopped" });
  });

  it("rejects a bad session body", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/sessions`, {
      method: "POST",
      headers: { authorization: "Bearer secret", "content-type": "application/json" },
      body: JSON.stringify({ host: "::1:19132" }),
    });
    expect(response.status).toBe(400);
  });
});
