import type { ServerStatus } from "./statusService";
import type { ServerEntry } from "./types";

export type LobbyStats = {
  serverCount: number;
  onlineCount: number;
  checkedCount: number;
  players: number;
  bestPing: number | null;
  bestPingName: string | null;
};

export type FeedTone = "online" | "offline" | "spike" | "ping" | "info";

export type FeedItem = {
  id: string;
  tone: FeedTone;
  serverName: string;
  text: string;
  at: number;
};

const SPIKE_MIN_PLAYERS = 5;
const SPIKE_MIN_RATIO = 0.15;

export function summarizeLobby(
  entries: ServerEntry[],
  statuses: Record<string, ServerStatus | undefined>,
): LobbyStats {
  let onlineCount = 0;
  let checkedCount = 0;
  let players = 0;
  let bestPing: number | null = null;
  let bestPingName: string | null = null;

  for (const server of entries) {
    const status = statuses[server.id];
    if (!status) {
      continue;
    }
    checkedCount += 1;
    if (!status.online) {
      continue;
    }
    onlineCount += 1;
    players += status.playersOnline ?? 0;
    if (status.pingMs != null && (bestPing == null || status.pingMs < bestPing)) {
      bestPing = status.pingMs;
      bestPingName = server.name;
    }
  }

  return { serverCount: entries.length, onlineCount, checkedCount, players, bestPing, bestPingName };
}

function isSpike(before: number, after: number): boolean {
  const gained = after - before;
  return gained >= SPIKE_MIN_PLAYERS && gained >= Math.max(1, before) * SPIKE_MIN_RATIO;
}

export function feedForChange(
  server: Pick<ServerEntry, "id" | "name">,
  before: ServerStatus | undefined,
  after: ServerStatus,
  now = Date.now(),
): FeedItem | null {
  const item = (tone: FeedTone, text: string): FeedItem => ({
    id: `${server.id}:${tone}:${now}`,
    tone,
    serverName: server.name,
    text,
    at: now,
  });

  if (!before) {
    return after.online ? item("online", "is online") : null;
  }
  if (!before.online && after.online) {
    return item("online", "came back online");
  }
  if (before.online && !after.online) {
    return item("offline", "went offline");
  }
  const playersBefore = before.playersOnline ?? 0;
  const playersAfter = after.playersOnline ?? 0;
  if (after.online && isSpike(playersBefore, playersAfter)) {
    return item("spike", `is heating up, +${playersAfter - playersBefore} players`);
  }
  return null;
}

export function pushFeed(feed: FeedItem[], item: FeedItem, limit = 4): FeedItem[] {
  return [item, ...feed.filter((existing) => existing.id !== item.id)].slice(0, limit);
}

export function formatCount(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString("en-US");
}

export function pingQuality(ping: number | null | undefined): 0 | 1 | 2 | 3 | 4 | 5 {
  if (ping == null) {
    return 0;
  }
  if (ping < 60) {
    return 5;
  }
  if (ping < 120) {
    return 4;
  }
  if (ping < 200) {
    return 3;
  }
  if (ping < 350) {
    return 2;
  }
  return 1;
}

export function heartsFor(ping: number | null | undefined, total = 10): number[] {
  const quality = pingQuality(ping);
  const halves = Math.round((quality / 5) * total * 2);
  return Array.from({ length: total }, (_, index) => {
    const left = halves - index * 2;
    return left >= 2 ? 2 : left === 1 ? 1 : 0;
  });
}

export function roomFor(online: number | null, max: number | null, total = 10): number[] {
  if (online == null || max == null || max <= 0) {
    return Array.from({ length: total }, () => 0);
  }
  const free = Math.max(0, Math.min(1, 1 - online / max));
  const halves = Math.round(free * total * 2);
  return Array.from({ length: total }, (_, index) => {
    const left = halves - index * 2;
    return left >= 2 ? 2 : left === 1 ? 1 : 0;
  });
}
