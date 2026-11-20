import { FEATURED_SERVER } from "./featured";
import type { PublicServer, SavedServer, ServerEntry } from "./types";

function serverKey(host: string, port: number | null, edition: string): string {
  return `${edition}|${host.toLowerCase()}|${port ?? ""}`;
}

export function buildCatalog(input: {
  saved: SavedServer[];
  favoriteIds: string[];
  publicServers: PublicServer[];
  favoriteServers?: PublicServer[];
}): ServerEntry[] {
  const favorites = new Set(input.favoriteIds);
  const featured: ServerEntry = {
    ...FEATURED_SERVER,
    favorite: favorites.has(FEATURED_SERVER.id),
  };

  const savedEntries: ServerEntry[] = input.saved.map((server) => ({
    id: server.id,
    name: server.name,
    host: server.host,
    port: server.port,
    edition: server.edition,
    authMode: server.authMode,
    favorite: favorites.has(server.id),
    featured: false,
    source: "saved",
    description: "",
  }));

  const seen = new Set<string>([
    serverKey(featured.host, featured.port, featured.edition),
    ...savedEntries.map((server) => serverKey(server.host, server.port, server.edition)),
  ]);

  const publicEntries: ServerEntry[] = [];
  const publicId = (id: string) => (id.startsWith("public:") ? id : `public:${id}`);
  const live = new Set(input.publicServers.map((server) => publicId(server.id)));
  const kept = (input.favoriteServers ?? []).filter((server) => favorites.has(server.id) && !live.has(server.id));
  for (const server of [...input.publicServers, ...kept]) {
    if (!server.host || !server.name || (server.edition !== "java" && server.edition !== "bedrock")) {
      continue;
    }
    const key = serverKey(server.host, server.port ?? null, server.edition);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const id = publicId(server.id);
    publicEntries.push({
      id,
      name: server.name,
      host: server.host,
      port: server.port ?? null,
      edition: server.edition,
      authMode: server.authMode === "offline" ? "offline" : "online",
      favorite: favorites.has(id),
      featured: false,
      source: "public",
      description: server.description ?? "",
    });
  }

  return [featured, ...savedEntries, ...publicEntries];
}

export function groupServers(entries: ServerEntry[], favoritesOnly = false) {
  const featured = entries.find((server) => server.featured) ?? null;
  const favorites = entries.filter((server) => server.favorite && !server.featured);
  const saved = entries.filter((server) => server.source === "saved" && !server.favorite);
  const publicServers = entries.filter((server) => server.source === "public" && !server.favorite);

  if (!favoritesOnly) {
    return { featured, favorites, saved, publicServers };
  }

  return {
    featured: featured?.favorite ? featured : null,
    favorites,
    saved: [],
    publicServers: [],
  };
}
