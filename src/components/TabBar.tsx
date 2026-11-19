import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tap } from "@/lib/haptics";
import { colors, fillParent, space } from "@/theme";
import { GrassGround } from "./blocks/Blocks";
import { PixelLabel } from "./hud/PixelLabel";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  onSelect: (routeKey: string) => void;
};

type Slot = { label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap };

const SLOTS: Record<string, Slot> = {
  index: { label: "Lobby", icon: "grid-outline", active: "grid" },
  add: { label: "Add", icon: "add-circle-outline", active: "add-circle" },
  favorites: { label: "Favorites", icon: "star-outline", active: "star" },
  settings: { label: "Settings", icon: "settings-outline", active: "settings" },
};

const SLOT_SIZE = 62;
const SLOT_GAP = 6;
const BAR_PADDING = 6;
const BAR_HEIGHT = SLOT_SIZE + BAR_PADDING * 2;

export function useTabContentInset(): number {
  const insets = useSafeAreaInsets();
  return BAR_HEIGHT + Math.max(insets.bottom, space.sm) + space.lg;
}

export function TabBar({ state, onSelect }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const selector = useSharedValue(state.index * (SLOT_SIZE + SLOT_GAP));

  useEffect(() => {
    selector.value = withSpring(state.index * (SLOT_SIZE + SLOT_GAP), { damping: 18, stiffness: 240 });
  }, [selector, state.index]);

  const selectorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: selector.value }] }));

  const bottom = Math.max(insets.bottom, space.sm);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: bottom }]}>
      <GrassGround height={bottom + BAR_HEIGHT / 2} />
      <View accessibilityRole="tablist" style={styles.bar}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.barTint} />
        <Animated.View pointerEvents="none" style={[styles.selector, selectorStyle]} />
        {state.routes.map((route, index) => {
          const slot = SLOTS[route.name] ?? { label: route.name, icon: "ellipse-outline", active: "ellipse" };
          const selected = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={slot.label}
              accessibilityState={{ selected }}
              onPress={() => {
                if (!selected) {
                  tap("light");
                }
                onSelect(route.key);
              }}
              style={[styles.slot, selected && styles.slotSelected]}
            >
              <PixelLabel size={6} color={selected ? colors.accent : "rgba(255,255,255,0.28)"} style={styles.key}>
                {String(index + 1)}
              </PixelLabel>
              <Ionicons
                name={selected ? slot.active : slot.icon}
                size={24}
                color={selected ? colors.accent : colors.secondary}
              />
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                style={[styles.label, selected && styles.labelSelected]}
              >
                {slot.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingTop: space.lg,
  },
  bar: {
    flexDirection: "row",
    gap: SLOT_GAP,
    padding: BAR_PADDING,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.edge,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  barTint: {
    ...fillParent,
    backgroundColor: "rgba(20,13,8,0.88)",
  },
  selector: {
    position: "absolute",
    top: BAR_PADDING - 3,
    left: BAR_PADDING - 3,
    width: SLOT_SIZE + 6,
    height: SLOT_SIZE + 6,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.5)",
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  slotSelected: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  key: {
    position: "absolute",
    top: 5,
    left: 6,
  },
  label: {
    color: colors.tertiary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  labelSelected: {
    color: colors.text,
  },
});
