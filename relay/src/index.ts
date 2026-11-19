import { execFile } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";

import { loadConfig } from "./config";
import { ProcessLauncher, reapOrphanPids } from "./launcher";
import { loadPublicServers } from "./publicServers";
import { createRelayServer, type HealthReport } from "./server";
import { PortAllocator, SessionManager } from "./sessions";

const execFileAsync = promisify(execFile);

async function javaWorks(bin: string): Promise<boolean> {
  try {
    await execFileAsync(bin, ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export async function main(): Promise<void> {
  const config = loadConfig();
  fs.mkdirSync(config.dataDir, { recursive: true });
  reapOrphanPids(config.dataDir);

  const javaReady = await javaWorks(config.javaBin);
  const launcher = new ProcessLauncher(config.javaBin, config.geyserJar);
  const sessions = new SessionManager({
    launcher,
    ports: new PortAllocator(config.portStart, config.portEnd),
    publicHost: config.publicHost,
    dataDir: config.dataDir,
    ttlMs: config.sessionTtlMs,
    maxSessions: config.maxSessions,
    readyTimeoutMs: config.readyTimeoutMs,
  });
  sessions.startReaper();

  const publicServers = loadPublicServers(config.publicServersFile);
  const server = createRelayServer({
    sessions,
    publicServers,
    token: config.token,
    health: (): HealthReport => ({
      ok: true,
      geyser: fs.existsSync(config.geyserJar) ? "ready" : "missing",
      java: javaReady ? "ready" : "missing",
      sessions: sessions.activeCount(),
      publicHost: config.publicHost,
    }),
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, "0.0.0.0", () => resolve());
  });
  console.log(`NetherNet relay listening on ${config.port}, advertising ${config.publicHost}`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
