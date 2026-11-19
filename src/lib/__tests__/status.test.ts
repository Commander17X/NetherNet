import { clearStatusCache, lookupStatus } from "../statusService";
import { decodeMcstatus, decodeMcsrvstat } from "../statusDecode";

const trixMcsrvstat = {
  ip: "151.243.241.250",
  port: 2788,
  hostname: "play.trix-islands.gg",
  online: true,
  version: "Lattice 26.3",
  protocol: { version: 777, name: "26.3" },
  players: { online: 0, max: 1000 },
  motd: {
    raw: ["§6§lTRIX-ISLANDS.GG §8| §fLobby §7· §eBoxPvP §7· §dParty §7· §aCreators§r"],
    clean: ["TRIX-ISLANDS.GG | Lobby · BoxPvP · Party · Creators"],
  },
  debug: {
    dns: {
      records: [
        {
          name: "_minecraft._tcp.play.trix-islands.gg",
          type: "SRV",
          priority: 0,
          weight: 5,
          port: 2788,
          target: "play.trix-islands.gg",
        },
      ],
    },
  },
};

const trixMcstatus = {
  online: true,
  host: "play.trix-islands.gg",
  port: 25565,
  ip_address: "151.243.241.250",
  srv_record: { host: "play.trix-islands.gg", port: 2788 },
  version: { name_raw: "Lattice 1.8.x", name_clean: "Lattice 1.8.x", protocol: 47 },
  players: { online: 2, max: 1000, list: [] },
  motd: { raw: "§6§lTRIX-ISLANDS.GG §8| §fLobby", clean: "TRIX-ISLANDS.GG | Lobby" },
  icon: null,
  software: null,
};

const hiveMcsrvstat = {
  online: true,
  ip: "57.129.146.87",
  port: 19132,
  hostname: "geo.hivebedrock.network",
  version: "1.0",
  players: { online: 9260, max: 1000 },
  motd: { raw: ["HIVE-O-WEEN | BEDWARS S5"], clean: ["HIVE-O-WEEN | BEDWARS S5"] },
  map: { raw: "Hive Games", clean: "Hive Games" },
  gamemode: "Survival",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("status decoding", () => {
  it("decodes a Java mcsrvstat payload, including the SRV port and colored MOTD", () => {
    const decoded = decodeMcsrvstat(trixMcsrvstat, "java");
    expect(decoded).not.toBeNull();
    expect(decoded).toMatchObject({
      online: true,
      port: 2788,
      srvPort: 2788,
      srvHost: "play.trix-islands.gg",
      playersOnline: 0,
      playersMax: 1000,
      version: "Lattice 26.3",
    });
    expect(decoded?.plainMotd).toContain("TRIX-ISLANDS.GG");
    expect(decoded?.motd[0]?.[0]).toMatchObject({ color: "#FFAA00", bold: true });
  });

  it("decodes mcstatus and prefers the SRV record over the default query port", () => {
    const decoded = decodeMcstatus(trixMcstatus, "java");
    expect(decoded).toMatchObject({
      online: true,
      port: 25565,
      srvPort: 2788,
      version: "Lattice 1.8.x",
      playersOnline: 2,
      favicon: null,
    });
  });

  it("decodes a Bedrock server and keeps the map name on a second line", () => {
    const decoded = decodeMcsrvstat(hiveMcsrvstat, "bedrock");
    expect(decoded).toMatchObject({
      online: true,
      port: 19132,
      playersOnline: 9260,
      version: "1.0",
      gameMode: "Survival",
    });
    expect(decoded?.plainMotd).toBe("HIVE-O-WEEN | BEDWARS S5\nHive Games");
  });

  it("decodes an offline server and rejects a body that is not a status", () => {
    expect(decodeMcsrvstat({ online: false, hostname: "play.example.com", port: 25565 }, "java")).toMatchObject({
      online: false,
      host: "play.example.com",
      port: 25565,
    });
    expect(decodeMcsrvstat({ hostname: "nope" }, "java")).toBeNull();
    expect(decodeMcstatus("nope", "bedrock")).toBeNull();
  });

  it("keeps a real png favicon and drops a fake one", () => {
    const png =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const decoded = decodeMcstatus({ ...trixMcstatus, icon: `data:image/png;base64,${png}` }, "java");
    expect(decoded?.favicon).toBe(`data:image/png;base64,${png}`);
    expect(decodeMcstatus({ ...trixMcstatus, icon: `data:image/png;base64,${"A".repeat(80)}` }, "java")?.favicon).toBeNull();
  });
});

describe("lookupStatus", () => {
  beforeEach(() => {
    clearStatusCache();
  });

  it("uses mcsrvstat first and connects on the SRV port", async () => {
    const fetchImpl = jest.fn(async (url: string) => {
      if (String(url).includes("dns-query") || String(url).includes("dns.google")) {
        return jsonResponse({ Status: 0, Answer: [{ type: 33, data: "0 5 2788 play.trix-islands.gg." }] });
      }
      expect(String(url)).toContain("api.mcsrvstat.us/3/play.trix-islands.gg:2788");
      return jsonResponse(trixMcsrvstat);
    });

    const status = await lookupStatus({
      host: "play.trix-islands.gg",
      port: null,
      edition: "java",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(status.online).toBe(true);
    expect(status.connectPort).toBe(2788);
    expect(status.connectHost).toBe("play.trix-islands.gg");
    expect(status.plainMotd).toContain("BoxPvP");
    expect(status.pingMs).toEqual(expect.any(Number));
  });

  it("falls back to mcstatus when the first API fails", async () => {
    const fetchImpl = jest.fn(async (url: string) => {
      const target = String(url);
      if (target.includes("mcsrvstat")) {
        return jsonResponse({ error: "nope" }, 503);
      }
      if (target.includes("mcstatus.io")) {
        return jsonResponse(trixMcstatus);
      }
      return jsonResponse({ Status: 3 });
    });

    const status = await lookupStatus({
      host: "play.trix-islands.gg",
      port: 25565,
      edition: "java",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(status.online).toBe(true);
    expect(status.version).toBe("Lattice 1.8.x");
    expect(status.connectPort).toBe(25565);
  });

  it("tries the second API when the first one says the server is offline", async () => {
    const fetchImpl = jest.fn(async (url: string) => {
      const target = String(url);
      if (target.includes("mcsrvstat")) {
        return jsonResponse({ online: false, hostname: "play.example.com", port: 25565 });
      }
      return jsonResponse({ ...trixMcstatus, host: "play.example.com" });
    });

    const status = await lookupStatus({
      host: "play.example.com",
      port: 25565,
      edition: "java",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(status.online).toBe(true);
    expect(status.playersOnline).toBe(2);
  });

  it("auto-detects a bedrock server when only that edition responds", async () => {
    const fetchImpl = jest.fn(async (url: string) => {
      const target = String(url);
      if (target.includes("dns")) {
        return jsonResponse({ Status: 3 });
      }
      if (target.includes("/java/") || target.includes("mcsrvstat.us/3/")) {
        return jsonResponse({ online: false, hostname: "geo.hivebedrock.network", port: 19132 });
      }
      return jsonResponse(hiveMcsrvstat);
    });

    const status = await lookupStatus({
      host: "geo.hivebedrock.network",
      port: null,
      edition: "auto",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(status.edition).toBe("bedrock");
    expect(status.online).toBe(true);
    expect(status.connectPort).toBe(19132);
    expect(status.plainMotd).toContain("Hive Games");
  });

  it("reports unreachable when every status API fails", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new Error("network down");
    });
    const status = await lookupStatus({
      host: "play.example.com",
      port: 25565,
      edition: "java",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(status.online).toBe(false);
    expect(status.unreachable).toBe(true);
    expect(status.error).toContain("network down");
  });
});
