import { StyleSheet, Text, View } from "react-native";

import { formatCount } from "@/lib/lobby";
import type { ServerStatus } from "@/lib/statusService";
import type { EditionChoice } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { PixelLabel } from "./hud/PixelLabel";
import { XpBar } from "./hud/XpBar";

export function statusTone(status?: ServerStatus | null): { label: string; color: string } {
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

export function StatusChip({ status }: { status?: ServerStatus | null }) {
  const tone = statusTone(status);
  return (
    <View
      accessible
      accessibilityLabel={tone.label}
      style={[styles.chip, { backgroundColor: `${tone.color}1F`, borderColor: `${tone.color}40` }]}
    >
      <View style={[styles.dot, { backgroundColor: tone.color }]} />
      <Text style={[styles.chipText, { color: tone.color }]}>{tone.label}</Text>
    </View>
  );
}

export function editionName(edition: EditionChoice | "java" | "bedrock"): string {
  return edition === "java" ? "Java" : edition === "bedrock" ? "Bedrock" : "Auto";
}

export function EditionChip({ edition }: { edition: EditionChoice }) {
  const color = edition === "java" ? "#FF9F5A" : edition === "bedrock" ? "#5AC8FF" : colors.secondary;
  return (
    <View
      accessible
      accessibilityLabel={`${editionName(edition)} edition`}
      style={[styles.edition, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}
    >
      <PixelLabel size={7} color={color}>
        {edition.toUpperCase()}
      </PixelLabel>
    </View>
  );
}

export function PlayerMeter({ status, height = 8 }: { status?: ServerStatus | null; height?: number }) {
  const online = status?.online ? status.playersOnline : null;
  const max = status?.online ? status.playersMax : null;
  const count =
    online == null
      ? status && !status.online
        ? "Offline"
        : "--"
      : `${formatCount(online)}${max ? ` / ${formatCount(max)}` : ""}`;
  return (
    <View style={styles.meter}>
      <XpBar
        value={online}
        max={max}
        height={height}
        label={online == null ? "Players unknown" : `${online} of ${max ?? "unknown"} players`}
      />
      <Text style={styles.count} numberOfLines={1}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  edition: {
    borderRadius: radius.pixel,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  meter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  count: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 64,
    flexShrink: 0,
    textAlign: "right",
  },
});
