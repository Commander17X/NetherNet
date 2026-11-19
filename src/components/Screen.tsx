import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, space, usePixelFont } from "@/theme";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const pixel = usePixelFont();
  return (
    <View style={styles.header}>
      <Text style={[styles.logo, { fontFamily: pixel }]}>NETHERNET</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Screen({ children, bottomInset = false }: { children: ReactNode; bottomInset?: boolean }) {
  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />
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
  glow: {
    position: "absolute",
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(232,163,23,0.12)",
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
