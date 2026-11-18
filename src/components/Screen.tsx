import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme";
import { BlockBackground } from "./BlockBackground";

export function Screen({ children, bottomInset = false }: { children: ReactNode; bottomInset?: boolean }) {
  return (
    <View style={styles.root}>
      <BlockBackground />
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
});
