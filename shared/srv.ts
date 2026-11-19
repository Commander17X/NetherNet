export type SrvRecord = {
  host: string;
  port: number;
  priority: number;
  weight: number;
};

export function srvName(host: string, edition: "java" | "bedrock"): string {
  const prefix = edition === "java" ? "_minecraft._tcp" : "_minecraft._udp";
  return `${prefix}.${host}`;
}

export function parseSrvData(data: string): SrvRecord | null {
  const parts = data.trim().replace(/\.$/, "").split(/\s+/);
  if (parts.length < 4) {
    return null;
  }
  const priority = Number(parts[0]);
  const weight = Number(parts[1]);
  const port = Number(parts[2]);
  const host = parts.slice(3).join("").replace(/\.$/, "");
  if (!Number.isInteger(priority) || !Number.isInteger(weight)) {
    return null;
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }
  if (!host || host.includes(" ")) {
    return null;
  }
  return { host: host.toLowerCase(), port, priority, weight };
}

export function pickSrv(records: SrvRecord[]): SrvRecord | null {
  if (records.length === 0) {
    return null;
  }
  const sorted = [...records].sort((a, b) => a.priority - b.priority || b.weight - a.weight);
  return sorted[0] ?? null;
}

type DnsAnswer = {
  type?: number;
  data?: string;
};

export function recordsFromDnsJson(body: unknown): SrvRecord[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const answers = (body as { Answer?: unknown }).Answer;
  if (!Array.isArray(answers)) {
    return [];
  }
  const records: SrvRecord[] = [];
  for (const answer of answers) {
    if (!answer || typeof answer !== "object") {
      continue;
    }
    const row = answer as DnsAnswer;
    if (row.type !== 33 || typeof row.data !== "string") {
      continue;
    }
    const parsed = parseSrvData(row.data);
    if (parsed) {
      records.push(parsed);
    }
  }
  return records;
}

export function shouldResolveSrv(host: string, port: number | null, kind: "domain" | "ipv4" | "ipv6"): boolean {
  return port === null && kind === "domain" && !host.includes(":");
}

export async function resolveSrv(
  host: string,
  edition: "java" | "bedrock",
  fetchImpl: typeof fetch = fetch,
): Promise<SrvRecord | null> {
  const name = srvName(host, edition);
  const urls = [
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=SRV`,
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=SRV`,
  ];

  for (const url of urls) {
    try {
      const response = await fetchImpl(url, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        continue;
      }
      const body: unknown = await response.json();
      const picked = pickSrv(recordsFromDnsJson(body));
      if (picked) {
        return picked;
      }
      const status = (body as { Status?: number }).Status;
      if (status === 0 || status === 3) {
        return null;
      }
    } catch {
      continue;
    }
  }

  return null;
}
