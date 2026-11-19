import { StyleSheet, Text, View } from "react-native";

import { formatCount, type LobbyStats } from "@/lib/lobby";
import { colors, space } from "@/theme";
import { GlassPanel } from "./GlassPanel";
import { PixelLabel } from "./PixelLabel";

function today(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export function Scoreboard({ stats, favorites, footer }: { stats: LobbyStats; favorites: number; footer: string }) {
  const waiting = stats.checkedCount === 0;
  const rows: { label: string; value: string; color?: string }[] = [
    { label: "Online", value: waiting ? "..." : `${stats.onlineCount}/${stats.serverCount}` },
    { label: "Players", value: waiting ? "..." : formatCount(stats.players), color: colors.xp },
    { label: "Best ping", value: stats.bestPing == null ? "--" : `${stats.bestPing}ms` },
    { label: "Favorites", value: String(favorites) },
  ];

  return (
    <GlassPanel round={10} tint="rgba(0,0,0,0.55)" style={styles.panel}>
      <View accessible accessibilityLabel={`Lobby. ${rows.map((row) => `${row.label} ${row.value}`).join(". ")}.`}>
        <View style={styles.title}>
          <PixelLabel size={10} color={colors.accent} shadow>
            LOBBY
          </PixelLabel>
          <Text style={styles.date}>{today()}</Text>
        </View>
        <View style={styles.body}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.label} numberOfLines={1}>
                {row.label}
              </Text>
              <PixelLabel size={9} color={row.color ?? colors.score} shadow>
                {row.value}
              </PixelLabel>
            </View>
          ))}
          {stats.bestPingName ? (
            <Text style={styles.best} numberOfLines={1}>
              Fastest: <Text style={styles.bestName}>{stats.bestPingName}</Text>
            </Text>
          ) : null}
          <PixelLabel size={7} color={colors.accent} style={styles.footer}>
            {footer.toUpperCase()}
          </PixelLabel>
        </View>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingVertical: space.sm + space.xs,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  body: {
    paddingHorizontal: space.md,
    paddingTop: space.sm + space.xs,
    paddingBottom: space.md,
    gap: space.xs + 2,
  },
  date: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
    minHeight: 22,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
  },
  best: {
    color: colors.tertiary,
    fontSize: 12,
    lineHeight: 16,
  },
  bestName: {
    color: colors.secondary,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    marginTop: space.sm,
  },
});
