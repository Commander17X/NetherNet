import { parseMotd } from "./motd";
import type { Edition, ServerStatus, StatusSource } from "./types";

const MCSRVSTAT_BASE = "https://api.mcsrvstat.us/3";
const MCSTATUS_BASE = "https://api.mcstatus.io/v2/status";
const CACHE_TTL_MS = 60_000;

type FetchLike = typeof fetch;

interface CacheEntry {
  status: ServerStatus;
  expiresAt: number;
}

const statusCache = new Map<string, CacheEntry>();

function cacheKey(host: string, edition: Edition): string {
  return `${edition}:${host.toLowerCase()}`;
}

export function clearStatusCache(): void {
  statusCache.clear();
}

function getCached(host: string, edition: Edition): ServerStatus | undefined {
  const entry = statusCache.get(cacheKey(host, edition));
  if (!entry) {
    return undefined;
  }
  if (Date.now() >= entry.expiresAt) {
    statusCache.delete(cacheKey(host, edition));
    return undefined;
  }
  return { ...entry.status, fromCache: true };
}

function setCached(host: string, edition: Edition, status: ServerStatus): void {
  statusCache.set(cacheKey(host, edition), {
    status,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

interface McSrvStatResponse {
  online?: boolean;
  ip?: string;
  port?: number;
  hostname?: string;
  version?: string;
  motd?: { raw?: string[]; clean?: string[] };
  players?: { online?: number; max?: number };
  protocol?: { version?: number };
  debug?: { srv?: boolean };
}

interface McStatusIoResponse {
  online: boolean;
  host: string;
  port: number;
  ip_address?: string;
  retrieved_at?: number;
  srv_record?: { host: string; port: number };
  version?: { name_clean?: string; name_raw?: string; protocol?: number };
  players?: { online: number; max: number };
  motd?: { raw?: string; clean?: string };
}

function mapMcSrvStat(host: string, body: McSrvStatResponse): ServerStatus {
  const rawMotd = body.motd?.raw?.[0] ?? body.motd?.clean?.[0];
  const srv = body.debug?.srv === true;
  return {
    online: body.online === true,
    host,
    port: body.port ?? 25565,
    resolvedHost: body.hostname,
    srv,
    ip: body.ip,
    motd: rawMotd ? parseMotd(rawMotd) : undefined,
    players:
      body.players?.online !== undefined && body.players?.max !== undefined
        ? { online: body.players.online, max: body.players.max }
        : undefined,
    version: body.version,
    protocol: body.protocol?.version,
    source: "mcsrvstat",
    retrievedAt: Date.now(),
  };
}

function mapMcStatusIo(host: string, body: McStatusIoResponse): ServerStatus {
  const rawMotd = body.motd?.raw ?? body.motd?.clean;
  const srv = Boolean(body.srv_record);
  return {
    online: body.online,
    host,
    port: body.srv_record?.port ?? body.port,
    resolvedHost: body.srv_record?.host ?? body.host,
    srv,
    ip: body.ip_address,
    motd: rawMotd ? parseMotd(rawMotd) : undefined,
    players: body.players,
    version: body.version?.name_clean ?? body.version?.name_raw,
    protocol: body.version?.protocol,
    source: "mcstatus",
    retrievedAt: body.retrieved_at ?? Date.now(),
  };
}

async function fetchMcSrvStat(
  host: string,
  edition: Edition,
  fetchFn: FetchLike,
): Promise<ServerStatus | undefined> {
  const path = edition === "bedrock" ? `${MCSRVSTAT_BASE}/bedrock/${host}` : `${MCSRVSTAT_BASE}/${host}`;
  const res = await fetchFn(path);
  if (!res.ok) {
    return undefined;
  }
  const body = (await res.json()) as McSrvStatResponse;
  if (body.online !== true && body.online !== false) {
    return undefined;
  }
  return mapMcSrvStat(host, body);
}

async function fetchMcStatusIo(
  host: string,
  edition: Edition,
  fetchFn: FetchLike,
): Promise<ServerStatus | undefined> {
  const path =
    edition === "bedrock"
      ? `${MCSTATUS_BASE}/bedrock/${host}`
      : `${MCSTATUS_BASE}/java/${host}`;
  const res = await fetchFn(path);
  if (!res.ok) {
    return undefined;
  }
  const body = (await res.json()) as McStatusIoResponse;
  return mapMcStatusIo(host, body);
}

export interface FetchServerStatusOptions {
  edition?: Edition;
  fetch?: FetchLike;
  bypassCache?: boolean;
}

export async function fetchServerStatus(
  host: string,
  options: FetchServerStatusOptions = {},
): Promise<ServerStatus> {
  const edition = options.edition ?? "java";
  const fetchFn = options.fetch ?? fetch;

  if (!options.bypassCache) {
    const cached = getCached(host, edition);
    if (cached) {
      return cached;
    }
  }

  let status: ServerStatus | undefined;
  let lastError: unknown;

  try {
    status = await fetchMcSrvStat(host, edition, fetchFn);
  } catch (err) {
    lastError = err;
  }

  if (!status) {
    try {
      status = await fetchMcStatusIo(host, edition, fetchFn);
    } catch (err) {
      lastError = err;
    }
  }

  if (!status) {
    const offline: ServerStatus = {
      online: false,
      host,
      port: edition === "bedrock" ? 19132 : 25565,
      source: "mcsrvstat",
      retrievedAt: Date.now(),
    };
    setCached(host, edition, offline);
    if (lastError) {
      return offline;
    }
    return offline;
  }

  setCached(host, edition, status);
  return status;
}

export function normalizeStatusSource(source: StatusSource): StatusSource {
  return source;
}