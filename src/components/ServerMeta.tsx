import { StyleSheet, Text, View } from "react-native";

import type { ServerStatus } from "@/lib/statusService";
import { colors, radius, space } from "@/theme";

export function statusLabel(status?: ServerStatus): { label: string; color: string } {
  if (!status) {
    return { label: "Checking", color: colors.tertiary };
  }
  if (status.online) {
    return { label: "Online", color: colors.online };
  }
  if (status.unreachable) {
    return { label: "No response", color: colors.warning };
  }
  return { label: "Offline", color: colors.offline };
}

export function StatusPill({ status }: { status?: ServerStatus }) {
  const tone = statusLabel(status);
  return (
    <View style={[styles.pill, { backgroundColor: `${tone.color}22` }]}>
      <View style={[styles.dot, { backgroundColor: tone.color }]} />
      <Text style={[styles.pillText, { color: tone.color }]}>{tone.label}</Text>
    </View>
  );
}

export function PlayerBar({ status }: { status?: ServerStatus }) {
  const online = status?.playersOnline ?? 0;
  const max = status?.playersMax ?? 0;
  const ratio = status?.online && max > 0 ? Math.max(0.04, Math.min(1, online / max)) : 0;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%` }]} />
    </View>
  );
}

export function PingBadge({ ping }: { ping: number | null | undefined }) {
  const color = ping == null ? colors.tertiary : ping < 120 ? colors.online : ping < 280 ? colors.warning : colors.offline;
  return (
    <View style={styles.ping}>
      <Text style={[styles.pingText, { color }]}>{ping == null ? "—" : `${ping} ms`}</Text>
    </View>
  );
}

export function ServerMeta({ status, players }: { status?: ServerStatus; players?: boolean }) {
  const count =
    status?.online && status.playersOnline != null ? `${status.playersOnline}/${status.playersMax ?? "?"}` : null;
  return (
    <View style={styles.row}>
      <StatusPill status={status} />
      <PlayerBar status={status} />
      {players && count ? <Text style={styles.count}>{count}</Text> : null}
      <PingBadge ping={status?.pingMs} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  count: {
    color: colors.secondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  ping: {
    minWidth: 52,
    alignItems: "flex-end",
  },
  pingText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
