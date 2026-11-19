import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tap } from "@/lib/haptics";
import { colors, space } from "@/theme";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  onSelect: (routeKey: string) => void;
};

const ITEMS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = {
  index: { label: "Servers", icon: "server-outline", active: "server" },
  add: { label: "Add", icon: "add-circle-outline", active: "add-circle" },
  favorites: { label: "Favorites", icon: "star-outline", active: "star" },
  settings: { label: "Settings", icon: "settings-outline", active: "settings" },
};

export function TabBar({ state, onSelect }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const item = ITEMS[route.name] ?? { label: route.name, icon: "ellipse-outline", active: "ellipse" };
          const selected = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => {
                tap("light");
                onSelect(route.key);
              }}
              style={styles.item}
            >
              <Ionicons name={selected ? item.active : item.icon} size={24} color={selected ? colors.accent : colors.tertiary} />
              <Text style={[styles.label, selected && styles.selected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.stroke,
    overflow: "hidden",
    backgroundColor: "rgba(12,14,18,0.72)",
  },
  row: {
    flexDirection: "row",
    paddingTop: space.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    minHeight: 48,
  },
  label: {
    color: colors.tertiary,
    fontSize: 11,
    fontWeight: "600",
  },
  selected: {
    color: colors.accent,
  },
});
