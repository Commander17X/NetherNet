import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "@/theme";

export function PixelPanel({
  children,
  accent = colors.black,
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <View style={[styles.shadow, { backgroundColor: accent }]}>
      <View style={styles.panel}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    paddingRight: 3,
    paddingBottom: 3,
  },
  panel: {
    backgroundColor: colors.panel,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: "rgba(255,255,255,0.28)",
    borderLeftColor: "rgba(255,255,255,0.18)",
    borderRightColor: "rgba(0,0,0,0.55)",
    borderBottomColor: "rgba(0,0,0,0.7)",
    padding: 12,
  },
});
