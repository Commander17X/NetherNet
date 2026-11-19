import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, typeScale } from "@/theme";
import { BrandMark, DirtBand } from "./blocks/Blocks";

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
          {kicker ? <BrandMark height={20} /> : <View />}
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

export function Screen({
  children,
  bottomInset = false,
  band = true,
}: {
  children: ReactNode;
  bottomInset?: boolean;
  band?: boolean;
}) {
  return (
    <View style={styles.root}>
      {band ? <DirtBand height={132} /> : null}
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
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    ...typeScale.callout,
    color: colors.secondary,
  },
});
