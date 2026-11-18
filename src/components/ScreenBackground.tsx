import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { tubnetColors } from "@/theme/tubnet";

export function ScreenBackground({ children }: PropsWithChildren) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tubnetColors.bg,
  },
});