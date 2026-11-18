import { formatHostForUrl } from "./address";
import type { Edition, ParsedAddress } from "./types";

const MINECRAFT_BEDROCK_SCHEME = "minecraft://";

export interface ExternalServerJoin {
  name: string;
  host: string;
  port: number;
  edition: Edition;
}

export function buildAddExternalServerUrl(server: ExternalServerJoin): string {
  const displayHost = formatHostForUrl(server.host);
  const payload = `${server.name}|${displayHost}:${server.port}`;
  const query = `addExternalServer=${encodeURIComponent(payload)}`;
  return `${MINECRAFT_BEDROCK_SCHEME}?${query}`;
}

export function buildAddExternalServerUrlFromParsed(
  name: string,
  parsed: ParsedAddress,
  edition: Edition = "bedrock",
): string {
  return buildAddExternalServerUrl({
    name,
    host: parsed.host,
    port: parsed.port,
    edition,
  });
}

export function parseAddExternalServerPayload(payload: string): ExternalServerJoin {
  const pipe = payload.indexOf("|");
  if (pipe === -1) {
    throw new Error("Invalid addExternalServer payload");
  }
  const name = decodeURIComponent(payload.slice(0, pipe));
  const hostPort = payload.slice(pipe + 1);
  const lastColon = hostPort.lastIndexOf(":");
  if (lastColon === -1) {
    throw new Error("Invalid addExternalServer host:port");
  }
  let hostPart = hostPort.slice(0, lastColon);
  const port = Number(hostPort.slice(lastColon + 1));
  if (hostPart.startsWith("[") && hostPart.endsWith("]")) {
    hostPart = hostPart.slice(1, -1);
  }
  return {
    name,
    host: hostPart,
    port,
    edition: "bedrock",
  };
}

export function parseAddExternalServerUrl(url: string): ExternalServerJoin {
  const parsed = new URL(url);
  if (parsed.protocol !== "minecraft:") {
    throw new Error("Expected minecraft:// URL");
  }
  const raw = parsed.searchParams.get("addExternalServer");
  if (!raw) {
    throw new Error("Missing addExternalServer query parameter");
  }
  return parseAddExternalServerPayload(decodeURIComponent(raw));
}