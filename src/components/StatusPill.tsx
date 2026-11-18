import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { tubnetColors, tubnetFonts } from "@/theme/tubnet";

type Props = {
  online?: boolean;
  loading?: boolean;
  players?: { online: number; max: number };
};

export function StatusPill({ online, loading, players }: Props) {
  if (loading) {
    return (
      <View style={[styles.pill, styles.muted]}>
        <ActivityIndicator size="small" color={tubnetColors.accent} />
        <Text style={styles.text}>PING</Text>
      </View>
    );
  }

  const isOn = online === true;
  return (
    <View style={[styles.pill, isOn ? styles.on : styles.off]}>
      <View style={[styles.dot, isOn ? styles.dotOn : styles.dotOff]} />
      <Text style={styles.text}>
        {isOn ? "ONLINE" : "OFFLINE"}
        {players ? ` ${players.online}/${players.max}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: tubnetColors.panelBorder,
  },
  on: {
    backgroundColor: "rgba(92, 224, 168, 0.12)",
  },
  off: {
    backgroundColor: "rgba(255, 107, 122, 0.12)",
  },
  muted: {
    backgroundColor: tubnetColors.panelHighlight,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  dotOn: {
    backgroundColor: tubnetColors.success,
  },
  dotOff: {
    backgroundColor: tubnetColors.danger,
  },
  text: {
    fontFamily: tubnetFonts.display,
    fontSize: 8,
    color: tubnetColors.text,
  },
});