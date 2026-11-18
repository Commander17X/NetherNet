import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { glassPanel, tubnetColors, tubnetSpacing } from "@/theme/tubnet";

type Props = PropsWithChildren<{
  style?: ViewStyle;
  padded?: boolean;
}>;

export function GlassPanel({ children, style, padded = true }: Props) {
  return (
    <View style={[styles.base, padded && styles.padded, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...glassPanel(),
  },
  padded: {
    padding: tubnetSpacing.md,
  },
  highlight: {
    backgroundColor: tubnetColors.panelHighlight,
  },
});