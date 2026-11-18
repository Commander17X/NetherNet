import { buildCatalog } from "./catalog";
import { RelayClient } from "./relayClient";
import { loadServerFile, loadSettings } from "./storage";
import type { ServerEntry } from "./types";

export async function findServer(id: string): Promise<ServerEntry | null> {
  const [file, settings] = await Promise.all([loadServerFile(), loadSettings()]);
  let publicServers: Awaited<ReturnType<RelayClient["listPublicServers"]>> = [];
  if (settings.relayUrl) {
    try {
      publicServers = await new RelayClient(settings.relayUrl, settings.relayToken).listPublicServers();
    } catch {
      publicServers = [];
    }
  }
  const catalog = buildCatalog({
    saved: file.servers,
    favoriteIds: file.favoriteIds,
    publicServers,
  });
  return catalog.find((server) => server.id === id) ?? null;
}
