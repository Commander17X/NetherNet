import fs from "node:fs";

export type PublicServer = {
  id: string;
  name: string;
  host: string;
  port: number | null;
  edition: "java" | "bedrock";
  featured: boolean;
  authMode: "online" | "offline";
  description: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function loadPublicServers(filePath: string): PublicServer[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }

  const servers: PublicServer[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    if (typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.host !== "string") {
      continue;
    }
    if (entry.edition !== "java" && entry.edition !== "bedrock") {
      continue;
    }
    const port = entry.port == null ? null : typeof entry.port === "number" ? entry.port : null;
    if (entry.port != null && port == null) {
      continue;
    }
    servers.push({
      id: entry.id,
      name: entry.name,
      host: entry.host,
      port,
      edition: entry.edition,
      featured: entry.featured === true,
      authMode: entry.authMode === "offline" ? "offline" : "online",
      description: typeof entry.description === "string" ? entry.description : "",
    });
  }
  return servers;
}
