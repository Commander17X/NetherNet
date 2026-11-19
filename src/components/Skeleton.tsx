import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { colors, radius, space } from "@/theme";

export function Skeleton({
  height,
  width = "100%",
  round = radius.sm,
}: {
  height: number;
  width?: number | `${number}%`;
  round?: number;
}) {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 850 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, animated, { height, width, borderRadius: round }]} />;
}

export function CardSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading" style={styles.card}>
      <View style={styles.row}>
        <Skeleton height={56} width={56} round={9} />
        <View style={styles.copy}>
          <Skeleton height={16} width="55%" />
          <Skeleton height={12} width="85%" />
          <Skeleton height={12} width="65%" />
        </View>
      </View>
      <View style={styles.row}>
        <Skeleton height={18} width={52} round={4} />
        <View style={styles.copy}>
          <Skeleton height={7} round={2} />
        </View>
        <Skeleton height={34} width={64} round={8} />
      </View>
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading featured server" style={[styles.card, styles.hero]}>
      <Skeleton height={18} width={140} round={4} />
      <View style={styles.row}>
        <Skeleton height={72} width={72} round={12} />
        <View style={styles.copy}>
          <Skeleton height={26} width="70%" />
          <Skeleton height={14} width="50%" />
        </View>
      </View>
      <Skeleton height={64} />
      <Skeleton height={52} round={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.fillStrong,
  },
  card: {
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  hero: {
    padding: space.lg,
    borderRadius: radius.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  copy: {
    flex: 1,
    gap: space.sm,
  },
});
