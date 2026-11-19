import { feedForChange, formatCount, heartsFor, pingQuality, pushFeed, roomFor, summarizeLobby } from "../lobby";
import { addPing, summarizePings } from "../pings";
import type { ServerStatus } from "../statusService";
import type { ServerEntry } from "../types";

function status(partial: Partial<ServerStatus>): ServerStatus {
  return {
    online: true,
    unreachable: false,
    error: null,
    edition: "java",
    host: "play.example.com",
    port: null,
    connectHost: "play.example.com",
    connectPort: 25565,
    motd: [],
    plainMotd: "",
    playersOnline: 10,
    playersMax: 100,
    version: "1.21",
    favicon: null,
    software: null,
    gameMode: null,
    pingMs: 80,
    checkedAt: 0,
    ...partial,
  };
}

function entry(id: string, name: string): ServerEntry {
  return {
    id,
    name,
    host: `${id}.example.com`,
    port: null,
    edition: "java",
    authMode: "online",
    favorite: false,
    featured: false,
    source: "saved",
    description: "",
  };
}

describe("lobby stats", () => {
  it("counts online servers, players and the best ping", () => {
    const entries = [entry("a", "Alpha"), entry("b", "Bravo"), entry("c", "Charlie")];
    const stats = summarizeLobby(entries, {
      a: status({ playersOnline: 12, pingMs: 90 }),
      b: status({ playersOnline: 30, pingMs: 41 }),
      c: status({ online: false, playersOnline: null, pingMs: 12 }),
    });
    expect(stats).toEqual({
      serverCount: 3,
      onlineCount: 2,
      checkedCount: 3,
      players: 42,
      bestPing: 41,
      bestPingName: "Bravo",
    });
  });

  it("handles servers that were not checked yet", () => {
    const stats = summarizeLobby([entry("a", "Alpha")], {});
    expect(stats.checkedCount).toBe(0);
    expect(stats.bestPing).toBeNull();
  });
});

describe("lobby feed", () => {
  const server = { id: "a", name: "Alpha" };

  it("announces a server the first time it answers", () => {
    expect(feedForChange(server, undefined, status({}), 5)?.text).toBe("is online");
    expect(feedForChange(server, undefined, status({ online: false }), 5)).toBeNull();
  });

  it("announces servers going up and down", () => {
    expect(feedForChange(server, status({ online: false }), status({}), 5)?.tone).toBe("online");
    expect(feedForChange(server, status({}), status({ online: false }), 5)?.tone).toBe("offline");
  });

  it("only calls a spike when enough players join", () => {
    expect(feedForChange(server, status({ playersOnline: 40 }), status({ playersOnline: 43 }), 5)).toBeNull();
    const spike = feedForChange(server, status({ playersOnline: 40 }), status({ playersOnline: 52 }), 5);
    expect(spike?.tone).toBe("spike");
    expect(spike?.text).toContain("+12");
  });

  it("keeps the newest items first and caps the list", () => {
    let feed = [] as ReturnType<typeof pushFeed>;
    for (let index = 0; index < 6; index += 1) {
      feed = pushFeed(feed, { id: String(index), tone: "info", serverName: "A", text: "x", at: index }, 3);
    }
    expect(feed.map((item) => item.id)).toEqual(["5", "4", "3"]);
  });
});

describe("hud helpers", () => {
  it("formats big player counts", () => {
    expect(formatCount(942)).toBe("942");
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(12_400)).toBe("12.4k");
    expect(formatCount(240_000)).toBe("240k");
  });

  it("maps ping to signal bars and hearts", () => {
    expect(pingQuality(null)).toBe(0);
    expect(pingQuality(30)).toBe(5);
    expect(pingQuality(500)).toBe(1);
    expect(heartsFor(30)).toEqual(Array(10).fill(2));
    expect(heartsFor(150).filter((value) => value > 0).length).toBe(6);
    expect(heartsFor(null)).toEqual(Array(10).fill(0));
  });

  it("shows free room as a row of halves", () => {
    expect(roomFor(0, 100)).toEqual(Array(10).fill(2));
    expect(roomFor(100, 100)).toEqual(Array(10).fill(0));
    expect(roomFor(55, 100)).toEqual([2, 2, 2, 2, 1, 0, 0, 0, 0, 0]);
    expect(roomFor(null, null)).toEqual(Array(10).fill(0));
  });
});

describe("ping history", () => {
  it("keeps a rolling window", () => {
    let list: number[] = [];
    for (let index = 0; index < 30; index += 1) {
      list = addPing(list, index, 24);
    }
    expect(list).toHaveLength(24);
    expect(list[0]).toBe(6);
    expect(addPing([1], Number.NaN)).toEqual([1]);
  });

  it("summarizes best, worst, average and jitter", () => {
    expect(summarizePings([40, 60, 50])).toEqual({ latest: 50, best: 40, worst: 60, average: 50, jitter: 15 });
    expect(summarizePings([]).latest).toBeNull();
  });
});
