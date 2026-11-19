import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, fillParent } from "@/theme";

const NOTCHES = 17;

export function XpBar({
  value,
  max,
  height = 8,
  color = colors.xp,
  label,
}: {
  value: number | null | undefined;
  max: number | null | undefined;
  height?: number;
  color?: string;
  label?: string;
}) {
  const ratio = value != null && max != null && max > 0 ? Math.max(value > 0 ? 0.03 : 0, Math.min(1, value / max)) : 0;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(ratio, { duration: 700 });
  }, [progress, ratio]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: color }, fill]}>
        <View style={styles.shine} />
      </Animated.View>
      <View pointerEvents="none" style={styles.notches}>
        {Array.from({ length: NOTCHES }, (_, index) => (
          <View key={index} style={styles.notch} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.8)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
  shine: {
    height: "35%",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  notches: {
    ...fillParent,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  notch: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
