import { defaultPort, parseServerAddress } from "./address";
import type { MotdLine } from "./motd";
import { resolveSrv, shouldResolveSrv, type SrvRecord } from "./srv";
import { decodeMcstatus, decodeMcsrvstat, type DecodedStatus, type ServerEdition } from "./statusDecode";
import type { EditionChoice } from "./types";

export type ServerStatus = {
  online: boolean;
  unreachable: boolean;
  error: string | null;
  edition: ServerEdition;
  host: string;
  port: number | null;
  connectHost: string;
  connectPort: number;
  motd: MotdLine[];
  plainMotd: string;
  playersOnline: number | null;
  playersMax: number | null;
  version: string | null;
  favicon: string | null;
  software: string | null;
  gameMode: string | null;
  pingMs: number | null;
  checkedAt: number;
};

type LookupInput = {
  host: string;
  port: number | null;
  edition: EditionChoice;
  fresh?: boolean;
  fetchImpl?: typeof fetch;
};

const CACHE_MS = 30_000;
const cache = new Map<string, { at: number; status: ServerStatus }>();

export function clearStatusCache(): void {
  cache.clear();
}

function cacheKey(host: string, port: number | null, edition: string): string {
  return `${edition}|${host.toLowerCase()}|${port ?? ""}`;
}

function endpoint(host: string, port: number | null): string {
  if (port == null) {
    return host;
  }
  return host.includes(":") ? `[${host}]:${port}` : `${host}:${port}`;
}

function blankStatus(input: {
  host: string;
  port: number | null;
  edition: ServerEdition;
  error: string;
  connectHost?: string;
  connectPort?: number;
}): ServerStatus {
  return {
    online: false,
    unreachable: true,
    error: input.error,
    edition: input.edition,
    host: input.host,
    port: input.port,
    connectHost: input.connectHost ?? input.host,
    connectPort: input.connectPort ?? input.port ?? defaultPort(input.edition),
    motd: [],
    plainMotd: "",
    playersOnline: null,
    playersMax: null,
    version: null,
    favicon: null,
    software: null,
    gameMode: null,
    pingMs: null,
    checkedAt: Date.now(),
  };
}

function fromDecoded(
  decoded: DecodedStatus,
  input: { host: string; port: number | null; edition: ServerEdition },
  srv: SrvRecord | null,
  pingMs: number | null,
): ServerStatus {
  const srvHost = (srv?.host ?? decoded.srvHost ?? "").replace(/\.$/, "") || null;
  const srvPort = srv?.port ?? decoded.srvPort;
  const connectHost = input.port == null && srvHost ? srvHost : input.host;
  const connectPort = input.port ?? srvPort ?? decoded.port ?? defaultPort(input.edition);

  return {
    online: decoded.online,
    unreachable: false,
    error: null,
    edition: input.edition,
    host: input.host,
    port: input.port,
    connectHost,
    connectPort,
    motd: decoded.motd,
    plainMotd: decoded.plainMotd,
    playersOnline: decoded.playersOnline,
    playersMax: decoded.playersMax,
    version: decoded.version,
    favicon: decoded.favicon,
    software: decoded.software,
    gameMode: decoded.gameMode,
    pingMs,
    checkedAt: Date.now(),
  };
}

async function queryProviders(
  host: string,
  port: number | null,
  edition: ServerEdition,
  fetchImpl: typeof fetch,
): Promise<{ decoded: DecodedStatus | null; pingMs: number | null; error: string }> {
  const target = endpoint(host, port);
  const providers = [
    {
      name: "mcsrvstat",
      url:
        edition === "java"
          ? `https://api.mcsrvstat.us/3/${target}`
          : `https://api.mcsrvstat.us/bedrock/3/${target}`,
      decode: (body: unknown) => decodeMcsrvstat(body, edition),
    },
    {
      name: "mcstatus",
      url: `https://api.mcstatus.io/v2/status/${edition}/${target}`,
      decode: (body: unknown) => decodeMcstatus(body, edition),
    },
  ];

  let lastError = "Status lookup failed.";
  let offline: DecodedStatus | null = null;
  let offlinePing: number | null = null;

  for (const provider of providers) {
    const started = Date.now();
    try {
      const response = await fetchImpl(provider.url, {
        headers: { accept: "application/json", "user-agent": "NetherNet/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      const pingMs = Date.now() - started;
      if (!response.ok) {
        lastError = `${provider.name} returned ${response.status}.`;
        continue;
      }
      const body: unknown = await response.json();
      const decoded = provider.decode(body);
      if (!decoded) {
        lastError = `${provider.name} sent a response NetherNet couldn't read.`;
        continue;
      }
      if (decoded.online) {
        return { decoded, pingMs, error: "" };
      }
      offline = decoded;
      offlinePing = pingMs;
      lastError = "Server looks offline.";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Status lookup failed.";
    }
  }

  if (offline) {
    return { decoded: offline, pingMs: offlinePing, error: "" };
  }
  return { decoded: null, pingMs: null, error: lastError };
}

async function lookupOne(
  input: { host: string; port: number | null; fresh?: boolean; fetchImpl?: typeof fetch },
  edition: ServerEdition,
): Promise<ServerStatus> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const key = cacheKey(input.host, input.port, edition);
  const cached = cache.get(key);
  if (!input.fresh && cached && Date.now() - cached.at < CACHE_MS) {
    return cached.status;
  }

  const parsed = parseServerAddress(input.port == null ? input.host : `${needsBrackets(input.host) ? `[${input.host}]` : input.host}:${input.port}`);
  if (!parsed.ok) {
    return blankStatus({ host: input.host, port: input.port, edition, error: parsed.error });
  }

  let queryHost = parsed.address.host;
  let queryPort = parsed.address.port;
  let srv: SrvRecord | null = null;
  if (shouldResolveSrv(parsed.address.host, parsed.address.port, parsed.address.kind)) {
    srv = await resolveSrv(parsed.address.host, edition, fetchImpl);
    if (srv) {
      queryHost = srv.host;
      queryPort = srv.port;
    }
  }

  const result = await queryProviders(queryHost, queryPort, edition, fetchImpl);
  const status = result.decoded
    ? fromDecoded(result.decoded, { host: parsed.address.host, port: parsed.address.port, edition }, srv, result.pingMs)
    : blankStatus({
        host: parsed.address.host,
        port: parsed.address.port,
        edition,
        error: result.error,
        connectHost: srv?.host ?? parsed.address.host,
        connectPort: parsed.address.port ?? srv?.port ?? defaultPort(edition),
      });

  cache.set(key, { at: Date.now(), status });
  return status;
}

function needsBrackets(host: string): boolean {
  return host.includes(":") && !host.startsWith("[");
}

function chooseAuto(java: ServerStatus, bedrock: ServerStatus, port: number | null): ServerStatus {
  if (java.online && bedrock.online) {
    return port === 19132 ? bedrock : java;
  }
  if (java.online) {
    return java;
  }
  if (bedrock.online) {
    return bedrock;
  }
  if (java.unreachable && !bedrock.unreachable) {
    return bedrock;
  }
  if (bedrock.unreachable && !java.unreachable) {
    return java;
  }
  return port === 19132 ? bedrock : java;
}

export async function lookupStatus(input: LookupInput): Promise<ServerStatus> {
  if (input.edition === "auto") {
    const key = cacheKey(input.host, input.port, "auto");
    const cached = cache.get(key);
    if (!input.fresh && cached && Date.now() - cached.at < CACHE_MS) {
      return cached.status;
    }
    const [java, bedrock] = await Promise.all([
      lookupOne(input, "java"),
      lookupOne(input, "bedrock"),
    ]);
    const chosen = chooseAuto(java, bedrock, input.port);
    cache.set(key, { at: Date.now(), status: chosen });
    return chosen;
  }

  return lookupOne(input, input.edition);
}

export async function detectEdition(
  host: string,
  port: number | null,
  fetchImpl?: typeof fetch,
): Promise<ServerEdition | null> {
  const status = await lookupStatus({ host, port, edition: "auto", fresh: true, fetchImpl });
  if (status.unreachable && !status.online) {
    return null;
  }
  return status.edition;
}
