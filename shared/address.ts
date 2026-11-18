export type AddressKind = "domain" | "ipv4" | "ipv6";

export type ParsedAddress = {
  host: string;
  port: number | null;
  kind: AddressKind;
};

export type AddressResult =
  | { ok: true; address: ParsedAddress }
  | { ok: false; error: string };

const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const DOMAIN =
  /^(?=.{1,253}$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?$/;

export function defaultPort(edition: "java" | "bedrock"): number {
  return edition === "java" ? 25565 : 19132;
}

export function formatAddress(host: string, port: number): string {
  const wrapped = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
  return `${wrapped}:${port}`;
}

function isIpv4(value: string): boolean {
  return IPV4.test(value);
}

function isIpv6(value: string): boolean {
  if (!value || !value.includes(":") || value.includes("%") || value.includes(":::")) {
    return false;
  }

  const sides = value.split("::");
  if (sides.length > 2) {
    return false;
  }

  const head = sides[0] ? sides[0].split(":") : [];
  const tail = sides.length === 2 && sides[1] ? sides[1].split(":") : [];
  const groups = [...head, ...tail];

  if (sides.length === 1 && groups.length !== 8) {
    return false;
  }
  if (sides.length === 2 && groups.length > 7) {
    return false;
  }
  if (groups.length === 0) {
    return sides.length === 2;
  }

  const hexGroups = [...groups];
  const last = hexGroups[hexGroups.length - 1];
  if (last && last.includes(".")) {
    if (!isIpv4(last)) {
      return false;
    }
    hexGroups.pop();
  }

  return hexGroups.every((group) => /^[0-9a-fA-F]{1,4}$/.test(group));
}

function parsePort(raw: string): number | null {
  if (!/^\d{1,5}$/.test(raw)) {
    return null;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }
  return port;
}

function classify(host: string): AddressKind | null {
  if (isIpv4(host)) {
    return "ipv4";
  }
  if (isIpv6(host)) {
    return "ipv6";
  }
  if (DOMAIN.test(host.toLowerCase())) {
    return "domain";
  }
  return null;
}

function stripPasted(input: string): string {
  let text = input.trim();
  text = text.replace(/^(?:minecraft|bedrock):\/\//i, "");
  text = text.replace(/^https?:\/\//i, "");
  const slash = text.indexOf("/");
  if (slash !== -1) {
    text = text.slice(0, slash);
  }
  const query = text.indexOf("?");
  if (query !== -1) {
    text = text.slice(0, query);
  }
  return text.trim();
}

export function parseServerAddress(input: string): AddressResult {
  const text = stripPasted(input);
  if (!text) {
    return { ok: false, error: "Enter a server address." };
  }

  let host = "";
  let portRaw: string | null = null;

  if (text.startsWith("[")) {
    const end = text.indexOf("]");
    if (end <= 1) {
      return { ok: false, error: "IPv6 address is missing the closing bracket." };
    }
    host = text.slice(1, end);
    const rest = text.slice(end + 1);
    if (rest.length === 0) {
      portRaw = null;
    } else if (rest.startsWith(":")) {
      portRaw = rest.slice(1);
      if (!portRaw) {
        return { ok: false, error: "Port is missing." };
      }
    } else {
      return { ok: false, error: "Unexpected text after the IPv6 address." };
    }
    if (!isIpv6(host)) {
      return { ok: false, error: "That IPv6 address doesn't look right." };
    }
  } else {
    const colonCount = text.split(":").length - 1;
    if (colonCount === 1) {
      const idx = text.lastIndexOf(":");
      host = text.slice(0, idx).trim();
      portRaw = text.slice(idx + 1).trim();
      if (!host) {
        return { ok: false, error: "Enter a server address." };
      }
      if (!portRaw) {
        return { ok: false, error: "Port is missing." };
      }
    } else if (colonCount > 1) {
      const lastColon = text.lastIndexOf(":");
      const maybePort = text.slice(lastColon + 1);
      if (/^\d{1,5}$/.test(maybePort) && !isIpv6(text)) {
        return {
          ok: false,
          error: "Put IPv6 addresses in brackets when you add a port, like [::1]:19132.",
        };
      }
      host = text;
    } else {
      host = text;
    }
  }

  host = host.trim();
  if (!host) {
    return { ok: false, error: "Enter a server address." };
  }

  const kind = classify(host);
  if (!kind) {
    return { ok: false, error: "Use a hostname, IPv4, or IPv6 address." };
  }

  let port: number | null = null;
  if (portRaw !== null) {
    port = parsePort(portRaw);
    if (port === null) {
      return { ok: false, error: "Port needs to be a number from 1 to 65535." };
    }
  }

  const normalizedHost =
    kind === "ipv6" ? host.toLowerCase() : kind === "domain" ? host.toLowerCase().replace(/\.$/, "") : host;

  return { ok: true, address: { host: normalizedHost, port, kind } };
}
