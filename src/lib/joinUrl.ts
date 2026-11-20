import { formatAddress } from "./address";

const SAFE_NAME = /[^\w .'-]+/g;

/**
 * Strips anything Bedrock can't use as a server address: a URL scheme,
 * a path, IPv6 brackets and a trailing dot. Bedrock wants a bare
 * hostname or IP in `serverUrl`.
 */
export function bareHost(host: string): string {
  return host
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^\[(.*)\]$/, "$1")
    .replace(/\.$/, "");
}

function validPort(port: number): number {
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 19132;
}

/**
 * Opens Bedrock and connects straight to the server.
 * Format: minecraft://connect/?serverUrl=<host>&serverPort=<port>
 */
export function buildMinecraftConnectUrl(host: string, port: number): string {
  return `minecraft://connect/?serverUrl=${encodeURIComponent(bareHost(host))}&serverPort=${validPort(port)}`;
}

/**
 * Adds the server to the Servers tab without joining.
 * Format: minecraft://?addExternalServer=<name>|<host>:<port>
 */
export function buildMinecraftAddServerUrl(name: string, host: string, port: number): string {
  const cleaned = name.replace(SAFE_NAME, " ").replace(/\s+/g, " ").trim().slice(0, 32);
  const label = cleaned || "NetherNet";
  const address = formatAddress(bareHost(host), validPort(port));
  return `minecraft://?addExternalServer=${encodeURIComponent(label)}|${address}`;
}
