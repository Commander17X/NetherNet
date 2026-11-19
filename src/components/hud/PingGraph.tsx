import { StyleSheet, Text, View } from "react-native";

import { PING_HISTORY_SIZE, summarizePings } from "@/lib/pings";
import { colors, space } from "@/theme";
import { signalColor } from "./SignalBars";

const GRAPH_CEILING = 400;

export function PingGraph({ pings, height = 72 }: { pings: number[]; height?: number }) {
  const summary = summarizePings(pings);
  const top = Math.min(GRAPH_CEILING, Math.max(100, summary.worst ?? 0)) * 1.15;
  const slots = Array.from(
    { length: PING_HISTORY_SIZE },
    (_, index) => pings[pings.length - PING_HISTORY_SIZE + index],
  );

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityLabel={
          summary.latest == null
            ? "Ping graph, waiting for readings"
            : `Ping graph. Latest ${summary.latest} ms, best ${summary.best}, worst ${summary.worst}.`
        }
        style={[styles.graph, { height }]}
      >
        <View pointerEvents="none" style={[styles.guide, { bottom: (100 / top) * height }]} />
        {slots.map((value, index) => (
          <View key={index} style={styles.slot}>
            {value == null ? (
              <View style={styles.ghost} />
            ) : (
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(3, Math.round((Math.min(value, top) / top) * height)),
                    backgroundColor: signalColor(value),
                    opacity: index === slots.length - 1 ? 1 : 0.55 + (index / slots.length) * 0.4,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.stats}>
        <Stat label="Now" value={summary.latest} highlight />
        <Stat label="Best" value={summary.best} />
        <Stat label="Avg" value={summary.average} />
        <Stat label="Jitter" value={summary.jitter} />
      </View>
    </View>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && value != null && { color: signalColor(value) }]}>
        {value == null ? "--" : `${value}`}
        <Text style={styles.unit}>{value == null ? "" : " ms"}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
  graph: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeStrong,
  },
  guide: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  slot: {
    flex: 1,
    justifyContent: "flex-end",
    height: "100%",
  },
  bar: {
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  ghost: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  stats: {
    flexDirection: "row",
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  unit: {
    color: colors.tertiary,
    fontSize: 13,
    fontWeight: "600",
  },
});
