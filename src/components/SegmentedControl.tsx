import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import { colors, radius, space } from "@/theme";

const PADDING = 3;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const slot = width > 0 ? (width - PADDING * 2) / options.length : 0;

  const offset = useSharedValue(0);
  const thumbWidth = useSharedValue(0);

  useEffect(() => {
    const first = thumbWidth.value === 0;
    thumbWidth.value = slot;
    offset.value = first ? index * slot : withSpring(index * slot, { damping: 22, stiffness: 260 });
  }, [index, offset, slot, thumbWidth]);

  const thumb = useAnimatedStyle(() => ({
    width: thumbWidth.value,
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={styles.track}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {slot > 0 ? <Animated.View pointerEvents="none" style={[styles.thumb, thumb]} /> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              if (!selected) {
                tap("light");
                onChange(option.value);
              }
            }}
            style={styles.item}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={15} color={selected ? colors.accentInk : colors.secondary} />
            ) : null}
            <Text maxFontSizeMultiplier={1.4} style={[styles.label, selected && styles.selectedLabel]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: PADDING,
  },
  thumb: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.sm + 1,
    backgroundColor: colors.accentFill,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.2)",
  },
  item: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    gap: space.xs + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.sm,
  },
  label: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedLabel: {
    color: colors.accentInk,
    fontWeight: "700",
  },
});
