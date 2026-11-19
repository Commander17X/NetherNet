import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

import { colors, radius } from "@/theme";

export function Skeleton({ height, width = "100%", round = radius.md }: { height: number; width?: number | `${number}%`; round?: number }) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, animated, { height, width, borderRadius: round }]} />;
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={52} width={52} round={14} />
      <View style={styles.copy}>
        <Skeleton height={16} width="62%" />
        <Skeleton height={12} width="40%" />
        <Skeleton height={10} width="88%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.fillStrong,
  },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  copy: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
});
