import { buildCatalog, groupServers } from "../catalog";
import { FEATURED_SERVER } from "../featured";
import { loadServerFile, saveDraft, setFavorite, toggleFavorite } from "../storage";
import type { ServerEntry } from "../types";

const mockMemory = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockMemory.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockMemory.set(key, value);
    },
  },
}));

const relayServer = {
  id: "hive",
  name: "The Hive",
  host: "geo.hivebedrock.network",
  port: 19132,
  edition: "bedrock" as const,
};

async function catalog(publicServers = [relayServer]): Promise<ServerEntry[]> {
  const file = await loadServerFile();
  return buildCatalog({
    saved: file.servers,
    favoriteIds: file.favoriteIds,
    favoriteServers: file.favoriteServers,
    publicServers,
  });
}

function find(entries: ServerEntry[], id: string): ServerEntry {
  const entry = entries.find((row) => row.id === id);
  if (!entry) {
    throw new Error(`missing ${id}`);
  }
  return entry;
}

beforeEach(() => {
  mockMemory.clear();
});

describe("favorites", () => {
  it("stars the featured server and shows it in the favorites tab", async () => {
    await toggleFavorite(find(await catalog(), FEATURED_SERVER.id));
    const groups = groupServers(await catalog(), true);
    expect(groups.featured?.id).toBe(FEATURED_SERVER.id);
    expect(groups.featured?.favorite).toBe(true);
  });

  it("stars a server you added", async () => {
    const saved = await saveDraft({
      name: "Home",
      host: "mc.example.com",
      port: 25570,
      edition: "java",
      authMode: "online",
    });
    await toggleFavorite(find(await catalog(), saved.id));
    const groups = groupServers(await catalog(), true);
    expect(groups.favorites.map((row) => row.id)).toEqual([saved.id]);
  });

  it("keeps a starred relay server even when the relay is away", async () => {
    await toggleFavorite(find(await catalog(), "public:hive"));
    const offline = groupServers(await catalog([]), true);
    expect(offline.favorites).toHaveLength(1);
    expect(offline.favorites[0]).toMatchObject({ id: "public:hive", host: "geo.hivebedrock.network", favorite: true });
    const online = await catalog();
    expect(online.filter((row) => row.id === "public:hive")).toHaveLength(1);
  });

  it("survives a restart because it lives in storage", async () => {
    await setFavorite(find(await catalog(), FEATURED_SERVER.id), true);
    const raw = JSON.parse(mockMemory.get("nethernet.servers.v1") ?? "{}") as { favoriteIds: string[] };
    expect(raw.favoriteIds).toContain(FEATURED_SERVER.id);
  });

  it("unstars and forgets the relay copy", async () => {
    const hive = find(await catalog(), "public:hive");
    await setFavorite(hive, true);
    await setFavorite({ ...hive, favorite: true }, false);
    const file = await loadServerFile();
    expect(file.favoriteIds).toEqual([]);
    expect(file.favoriteServers).toEqual([]);
  });

  it("does not lose a star when two taps land at once", async () => {
    const entries = await catalog();
    await Promise.all([
      setFavorite(find(entries, FEATURED_SERVER.id), true),
      setFavorite(find(entries, "public:hive"), true),
    ]);
    const file = await loadServerFile();
    expect(file.favoriteIds.sort()).toEqual([FEATURED_SERVER.id, "public:hive"].sort());
  });
});
