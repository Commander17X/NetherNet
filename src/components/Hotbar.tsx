import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, usePixelFont } from "@/theme";

type HotbarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  onSelect: (routeKey: string) => void;
};

const ICONS: Record<string, string> = {
  index: "LIST",
  add: "ADD",
  favorites: "FAV",
  settings: "OPT",
};

export function Hotbar({ state, onSelect }: HotbarProps) {
  const insets = useSafeAreaInsets();
  const font = usePixelFont();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={route.name}
              onPress={() => onSelect(route.key)}
              style={[styles.slot, selected && styles.selected]}
            >
              <View style={styles.iconBox}>
                <Text style={[styles.icon, { fontFamily: font }]}>{ICONS[route.name] ?? "NET"}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 3,
    borderTopColor: "#C8A15A",
  },
  bar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  slot: {
    width: 62,
    height: 58,
    backgroundColor: colors.slot,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderTopColor: "#6E7688",
    borderLeftColor: "#6E7688",
    borderRightColor: "#1A1E2A",
    borderBottomColor: "#1A1E2A",
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderTopColor: colors.white,
    borderLeftColor: colors.white,
    borderRightColor: colors.white,
    borderBottomColor: colors.white,
  },
  iconBox: {
    alignItems: "center",
  },
  icon: {
    color: colors.gold,
    fontSize: 9,
    lineHeight: 14,
  },
});
