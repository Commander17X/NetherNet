import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, usePixelFont } from "@/theme";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const pixel = usePixelFont();
  return (
    <View style={styles.header}>
      <Text maxFontSizeMultiplier={1.2} style={[styles.logo, { fontFamily: pixel }]}>
        NETHERNET
      </Text>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Screen({ children, bottomInset = false }: { children: ReactNode; bottomInset?: boolean }) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={bottomInset ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]}>
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
    gap: 4,
    paddingTop: space.sm,
  },
  logo: {
    color: colors.accent,
    fontSize: 10,
    lineHeight: 16,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 22,
  },
});
