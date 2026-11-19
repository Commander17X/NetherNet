import { parseFavicon } from "./favicon";
import { motdPlain, parseMotd, type MotdLine } from "./motd";

export type ServerEdition = "java" | "bedrock";

export type DecodedStatus = {
  online: boolean;
  host: string | null;
  port: number | null;
  srvHost: string | null;
  srvPort: number | null;
  motd: MotdLine[];
  plainMotd: string;
  playersOnline: number | null;
  playersMax: number | null;
  version: string | null;
  favicon: string | null;
  software: string | null;
  gameMode: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readPlayers(body: Record<string, unknown>): { online: number | null; max: number | null } {
  const players = asRecord(body.players);
  if (!players) {
    return { online: null, max: null };
  }
  return { online: asNumber(players.online), max: asNumber(players.max) };
}

function readFavicon(value: unknown): string | null {
  return parseFavicon(value);
}

function readSrv(body: Record<string, unknown>): { host: string | null; port: number | null } {
  const direct = asRecord(body.srv_record) ?? asRecord(body.srv);
  if (direct) {
    return {
      host: asString(direct.host) ?? asString(direct.target),
      port: asNumber(direct.port),
    };
  }

  const debug = asRecord(body.debug);
  const dns = debug ? asRecord(debug.dns) : null;
  const records = dns && Array.isArray(dns.records) ? dns.records : [];
  for (const record of records) {
    const row = asRecord(record);
    if (!row || row.type !== "SRV") {
      continue;
    }
    const port = asNumber(row.port);
    if (port === null) {
      continue;
    }
    return { host: asString(row.target), port };
  }

  return { host: null, port: null };
}

function readMotdSource(body: Record<string, unknown>): unknown {
  const motd = asRecord(body.motd);
  if (motd) {
    if (motd.raw != null) {
      return motd.raw;
    }
    if (typeof motd.clean === "string" || Array.isArray(motd.clean)) {
      return motd.clean;
    }
  }
  if (body.description != null) {
    return body.description;
  }
  return "";
}

function readVersion(body: Record<string, unknown>): string | null {
  if (typeof body.version === "string") {
    return body.version;
  }
  const version = asRecord(body.version);
  if (version) {
    return (
      asString(version.name_clean) ??
      asString(version.name_raw) ??
      asString(version.name) ??
      null
    );
  }
  const protocol = asRecord(body.protocol);
  if (protocol && typeof protocol.name === "string") {
    return protocol.name;
  }
  return null;
}

function finish(
  body: Record<string, unknown>,
  edition: ServerEdition,
  online: boolean,
): DecodedStatus {
  const players = readPlayers(body);
  const srv = readSrv(body);
  const mapLine =
    edition === "bedrock"
      ? asString(asRecord(body.map)?.clean) ?? asString(asRecord(body.map)?.raw)
      : null;
  let motd = parseMotd(readMotdSource(body));
  const plain = motdPlain(motd);
  if (mapLine && !plain.includes(mapLine)) {
      motd = [
        ...motd,
        [
          {
            text: mapLine,
            color: "#AAAAAA",
            bold: false,
            italic: false,
            underlined: false,
            strikethrough: false,
            obfuscated: false,
          },
        ],
      ];
  }

  const host =
    asString(body.hostname) ??
    asString(body.host) ??
    asString(body.ip_address) ??
    asString(body.ip);

  return {
    online,
    host,
    port: asNumber(body.port),
    srvHost: srv.host ? srv.host.replace(/\.$/, "") : null,
    srvPort: srv.port,
    motd,
    plainMotd: motdPlain(motd),
    playersOnline: players.online,
    playersMax: players.max,
    version: readVersion(body),
    favicon: readFavicon(body.icon) ?? readFavicon(body.favicon),
    software: asString(body.software),
    gameMode: asString(body.gamemode),
  };
}

export function decodeMcsrvstat(body: unknown, edition: ServerEdition): DecodedStatus | null {
  const record = asRecord(body);
  if (!record || typeof record.online !== "boolean") {
    return null;
  }
  return finish(record, edition, record.online);
}

export function decodeMcstatus(body: unknown, edition: ServerEdition): DecodedStatus | null {
  const record = asRecord(body);
  if (!record || typeof record.online !== "boolean") {
    return null;
  }
  return finish(record, edition, record.online);
}
