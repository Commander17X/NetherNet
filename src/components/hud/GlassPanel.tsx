import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, fillParent, radius } from "@/theme";

export function GlassPanel({
  children,
  style,
  round = radius.lg,
  tint = colors.panel,
  bevel = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  round?: number;
  tint?: string;
  bevel?: boolean;
}) {
  return (
    <View style={[styles.panel, { borderRadius: round }, style]}>
      <BlurView intensity={30} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: round }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint, borderRadius: round }]} />
      {bevel ? <View pointerEvents="none" style={[styles.bevel, { borderRadius: round }]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  bevel: {
    ...fillParent,
    borderTopWidth: 1,
    borderTopColor: colors.bevelLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.bevelDark,
  },
});
