import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, typeScale } from "@/theme";
import { PixelLabel } from "./hud/PixelLabel";

export function Wordmark({ color = colors.accent }: { color?: string }) {
  return (
    <PixelLabel size={11} color={color} shadow>
      NETHERNET
    </PixelLabel>
  );
}

export function PageHeader({
  title,
  subtitle,
  accessory,
  kicker = true,
}: {
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
  kicker?: boolean;
}) {
  return (
    <View style={styles.header}>
      {kicker || accessory ? (
        <View style={styles.kickerRow}>
          {kicker ? <Wordmark /> : <View />}
          {accessory}
        </View>
      ) : null}
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text maxFontSizeMultiplier={1.6} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function AmbientGlow({ height = 420 }: { height?: number }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={["rgba(245,178,27,0.14)", "rgba(245,178,27,0.05)", "rgba(245,178,27,0)"]}
      locations={[0, 0.45, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.glow, { height }]}
    />
  );
}

export function Screen({
  children,
  bottomInset = false,
  glow = true,
}: {
  children: ReactNode;
  bottomInset?: boolean;
  glow?: boolean;
}) {
  return (
    <View style={styles.root}>
      {glow ? <AmbientGlow /> : null}
      <SafeAreaView
        style={styles.safe}
        edges={bottomInset ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    gap: space.xs,
    paddingTop: space.sm,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
    marginBottom: space.xs,
  },
  title: {
    ...typeScale.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...typeScale.callout,
    color: colors.secondary,
  },
});
