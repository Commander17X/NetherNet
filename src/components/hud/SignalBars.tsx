import { StyleSheet, View } from "react-native";

import { pingQuality } from "@/lib/lobby";
import { colors } from "@/theme";

const HEIGHTS = [4, 7, 10, 13, 16];

export function signalColor(ping: number | null | undefined): string {
  const quality = pingQuality(ping);
  if (quality >= 4) {
    return colors.online;
  }
  if (quality === 3) {
    return colors.warning;
  }
  if (quality > 0) {
    return colors.offline;
  }
  return colors.tertiary;
}

export function SignalBars({
  ping,
  offline = false,
  scale = 1,
}: {
  ping: number | null | undefined;
  offline?: boolean;
  scale?: number;
}) {
  const quality = offline ? 0 : pingQuality(ping);
  const color = offline ? colors.offline : signalColor(ping);
  const label = offline
    ? "No signal"
    : ping == null
      ? "Checking signal"
      : `Signal ${quality} of 5, ${ping} milliseconds`;
  return (
    <View accessible accessibilityLabel={label} style={[styles.row, { gap: 1.5 * scale, height: 16 * scale }]}>
      {HEIGHTS.map((height, index) => (
        <View
          key={height}
          style={{
            width: 3 * scale,
            height: height * scale,
            backgroundColor:
              index < quality ? color : offline && index === 0 ? colors.offline : "rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});
