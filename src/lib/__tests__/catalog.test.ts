import { buildCatalog, groupServers } from "../catalog";
import { buildMinecraftJoinUrl } from "../joinUrl";
import { parseSrvData, pickSrv, recordsFromDnsJson, srvName } from "../srv";
import type { SavedServer } from "../types";

const saved: SavedServer = {
  id: "srv_home",
  name: "Home",
  host: "192.168.1.20",
  port: 19132,
  edition: "bedrock",
  authMode: "online",
  createdAt: 1,
  updatedAt: 1,
};

describe("catalog", () => {
  it("pins the featured server and keeps saved servers", () => {
    const entries = buildCatalog({
      saved: [saved],
      favoriteIds: ["featured:trix-islands", saved.id],
      publicServers: [
        {
          id: "trix-islands",
          name: "Trix Islands",
          host: "play.trix-islands.gg",
          port: null,
          edition: "java",
        },
        {
          id: "friends",
          name: "Friends",
          host: "friends.example.com",
          port: 25570,
          edition: "java",
          description: "A small smp",
        },
      ],
    });

    expect(entries[0]).toMatchObject({ id: "featured:trix-islands", featured: true, favorite: true });
    expect(entries.map((entry) => entry.name)).toEqual(["Trix Islands", "Home", "Friends"]);
    expect(entries[2]).toMatchObject({ id: "public:friends", port: 25570, description: "A small smp" });

    const groups = groupServers(entries);
    expect(groups.featured?.name).toBe("Trix Islands");
    expect(groups.favorites.map((entry) => entry.name)).toEqual(["Home"]);
    expect(groups.saved).toEqual([]);
    expect(groups.publicServers.map((entry) => entry.name)).toEqual(["Friends"]);
  });

  it("can show only favorites", () => {
    const entries = buildCatalog({ saved: [saved], favoriteIds: [], publicServers: [] });
    const groups = groupServers(entries, true);
    expect(groups.featured).toBeNull();
    expect(groups.favorites).toEqual([]);
  });
});

describe("join urls", () => {
  it("builds a minecraft external-server link and brackets ipv6", () => {
    expect(buildMinecraftJoinUrl("Trix Islands", "play.trix-islands.gg", 2788)).toBe(
      "minecraft://?addExternalServer=Trix%20Islands|play.trix-islands.gg:2788",
    );
    expect(buildMinecraftJoinUrl("Lan", "::1", 19132)).toBe("minecraft://?addExternalServer=Lan|[::1]:19132");
    expect(buildMinecraftJoinUrl("Bad|Name", "10.0.0.2", 19150)).toBe(
      "minecraft://?addExternalServer=Bad%20Name|10.0.0.2:19150",
    );
  });
});

describe("srv records", () => {
  it("parses and picks the lowest priority record", () => {
    expect(srvName("play.trix-islands.gg", "java")).toBe("_minecraft._tcp.play.trix-islands.gg");
    expect(srvName("geo.hivebedrock.network", "bedrock")).toBe("_minecraft._udp.geo.hivebedrock.network");
    const records = recordsFromDnsJson({
      Status: 0,
      Answer: [
        { type: 33, data: "10 5 25565 backup.example.com." },
        { type: 33, data: "0 5 2788 play.trix-islands.gg." },
        { type: 1, data: "151.243.241.250" },
      ],
    });
    expect(pickSrv(records)).toEqual({
      host: "play.trix-islands.gg",
      port: 2788,
      priority: 0,
      weight: 5,
    });
    expect(parseSrvData("nope")).toBeNull();
  });
});
