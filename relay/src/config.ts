import path from 'node:path';

const relayRoot = path.resolve(__dirname, '..');

export interface RelayConfig {
  publicHost: string;
  apiToken: string | undefined;
  port: number;
  geyserMode: 'standalone' | 'docker';
  geyserJarPath: string;
  geyserSessionsDir: string;
  portPoolMin: number;
  portPoolMax: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  allowPrivateTargets: boolean;
  publicServersPath: string;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid ${name}: ${raw}`);
  return n;
}

function parseBoolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === '1' || raw.toLowerCase() === 'true' || raw.toLowerCase() === 'yes';
}

export function loadConfig(): RelayConfig {
  const publicHost = process.env.PUBLIC_HOST ?? '127.0.0.1';
  return {
    publicHost,
    apiToken: process.env.RELAY_API_TOKEN?.trim() || undefined,
    port: parseIntEnv('PORT', 8787),
    geyserMode: process.env.GEYSER_MODE === 'docker' ? 'docker' : 'standalone',
    geyserJarPath: process.env.GEYSER_JAR_PATH ?? path.join(relayRoot, 'geyser.jar'),
    geyserSessionsDir: process.env.GEYSER_SESSIONS_DIR ?? path.join(relayRoot, '.geyser-sessions'),
    portPoolMin: parseIntEnv('PORT_POOL_MIN', 19132),
    portPoolMax: parseIntEnv('PORT_POOL_MAX', 19232),
    rateLimitWindowMs: parseIntEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    rateLimitMax: parseIntEnv('RATE_LIMIT_MAX', 60),
    allowPrivateTargets: parseBoolEnv('ALLOW_PRIVATE_TARGETS', false),
    publicServersPath:
      process.env.PUBLIC_SERVERS_PATH ?? path.join(relayRoot, 'config', 'public-servers.json'),
  };
}