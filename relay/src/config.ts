import path from "node:path";

export type RelayConfig = {
  port: number;
  publicHost: string;
  token: string;
  dataDir: string;
  geyserJar: string;
  javaBin: string;
  portStart: number;
  portEnd: number;
  sessionTtlMs: number;
  maxSessions: number;
  readyTimeoutMs: number;
  publicServersFile: string;
};

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isInteger(value) ? value : fallback;
}

export function loadConfig(): RelayConfig {
  return {
    port: integer("PORT", 8787),
    publicHost: process.env.PUBLIC_HOST?.trim() || "127.0.0.1",
    token: process.env.RELAY_TOKEN?.trim() || "",
    dataDir: process.env.DATA_DIR?.trim() || path.join(process.cwd(), "data"),
    geyserJar: process.env.GEYSER_JAR?.trim() || "/opt/geyser/Geyser-Standalone.jar",
    javaBin: process.env.JAVA_BIN?.trim() || "java",
    portStart: integer("PORT_RANGE_START", 19132),
    portEnd: integer("PORT_RANGE_END", 19151),
    sessionTtlMs: integer("SESSION_TTL_MS", 20 * 60 * 1000),
    maxSessions: integer("MAX_SESSIONS", 8),
    readyTimeoutMs: integer("READY_TIMEOUT_MS", 45_000),
    publicServersFile:
      process.env.PUBLIC_SERVERS_FILE?.trim() || path.join(process.cwd(), "config", "public-servers.json"),
  };
}
