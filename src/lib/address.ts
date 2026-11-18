import type { Edition, ParsedAddress, ServerStatus } from "./types";

export const JAVA_DEFAULT_PORT = 25565;
export const BEDROCK_DEFAULT_PORT = 19132;

export function defaultPort(edition: Edition): number {
  return edition === "bedrock" ? BEDROCK_DEFAULT_PORT : JAVA_DEFAULT_PORT;
}

function isIPv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) {
    return false;
  }
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) {
      return false;
    }
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function looksLikeIPv6(value: string): boolean {
  return value.includes(":");
}

export function formatHostForUrl(host: string): string {
  if (host.includes(":") && !host.startsWith("[")) {
    return `[${host}]`;
  }
  return host;
}

export function parseAddress(input: string, edition: Edition = "java"): ParsedAddress {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Address cannot be empty");
  }

  const bracketed = trimmed.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (bracketed) {
    const host = bracketed[1] ?? "";
    const port = bracketed[2] ? Number(bracketed[2]) : defaultPort(edition);
    return {
      host,
      port,
      displayHost: `[${host}]`,
    };
  }

  const lastColon = trimmed.lastIndexOf(":");
  if (lastColon > 0) {
    const hostPart = trimmed.slice(0, lastColon);
    const portPart = trimmed.slice(lastColon + 1);
    const hasSingleColon = trimmed.indexOf(":") === lastColon;
    if (/^\d+$/.test(portPart) && (hasSingleColon || isIPv4(hostPart))) {
      return {
        host: hostPart,
        port: Number(portPart),
        displayHost: formatHostForUrl(hostPart),
      };
    }
  }

  return {
    host: trimmed,
    port: defaultPort(edition),
    displayHost: looksLikeIPv6(trimmed) ? `[${trimmed}]` : trimmed,
  };
}

/** Apply SRV / status API port hints when the user did not specify a port. */
export function applyStatusAddressHints(
  parsed: ParsedAddress,
  status: Pick<ServerStatus, "port" | "resolvedHost" | "host" | "srv">,
  edition: Edition,
  userSpecifiedPort: boolean,
): ParsedAddress {
  let host = parsed.host;
  let port = parsed.port;
  let displayHost = parsed.displayHost;

  if (status.srv || status.port !== defaultPort(edition)) {
    if (!userSpecifiedPort && status.port > 0) {
      port = status.port;
    }
    if (status.resolvedHost) {
      host = status.resolvedHost;
      displayHost = formatHostForUrl(host);
    } else if (status.host && (status.srv || !userSpecifiedPort)) {
      host = status.host;
      displayHost = formatHostForUrl(host);
    }
  }

  return { host, port, displayHost };
}

export function userSpecifiedPort(input: string): boolean {
  const trimmed = input.trim();
  const bracketed = trimmed.match(/^\[([^\]]+)\]:(\d+)$/);
  if (bracketed) {
    return true;
  }
  if (!trimmed.includes(":")) {
    return false;
  }
  const lastColon = trimmed.lastIndexOf(":");
  const portPart = trimmed.slice(lastColon + 1);
  const hostPart = trimmed.slice(0, lastColon);
  if (/^\d+$/.test(portPart) && (trimmed.indexOf(":") === lastColon || isIPv4(hostPart))) {
    return true;
  }
  return false;
}

export function formatHostPort(parsed: ParsedAddress): string {
  return `${parsed.displayHost}:${parsed.port}`;
}