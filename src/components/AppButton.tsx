import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import { colors, fillParent, radius, space } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const faces: Record<Variant, { background: string; label: string; border: string; top: string; bottom: string }> = {
  primary: {
    background: colors.accentFill,
    label: colors.accentInk,
    border: colors.edge,
    top: "rgba(255,255,255,0.32)",
    bottom: "rgba(0,0,0,0.35)",
  },
  secondary: {
    background: "rgba(255,255,255,0.08)",
    label: colors.text,
    border: colors.edge,
    top: "rgba(255,255,255,0.10)",
    bottom: "rgba(0,0,0,0.3)",
  },
  ghost: {
    background: "transparent",
    label: colors.secondary,
    border: "transparent",
    top: "transparent",
    bottom: "transparent",
  },
  danger: {
    background: colors.dangerSoft,
    label: colors.danger,
    border: "rgba(255,92,92,0.3)",
    top: "rgba(255,255,255,0.06)",
    bottom: "rgba(0,0,0,0.25)",
  },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
  compact = false,
  icon,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityHint?: string;
}) {
  const face = faces[variant];
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const inactive = disabled || busy;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPressIn={() => {
        scale.set(withSpring(0.97, { damping: 20, stiffness: 400 }));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, { damping: 16, stiffness: 300 }));
      }}
      onPress={() => {
        tap(variant === "primary" ? "medium" : "light");
        onPress();
      }}
      style={[
        styles.button,
        compact && styles.compact,
        { backgroundColor: face.background, borderColor: face.border },
        disabled && !busy && styles.disabled,
        pressStyle,
      ]}
    >
      {variant !== "ghost" ? (
        <View
          pointerEvents="none"
          style={[
            styles.bevel,
            { borderTopColor: face.top, borderBottomColor: face.bottom, borderRadius: compact ? radius.sm : radius.md },
          ]}
        />
      ) : null}
      {busy ? (
        <ActivityIndicator size="small" color={face.label} />
      ) : icon ? (
        <Ionicons name={icon} size={compact ? 16 : 19} color={face.label} />
      ) : null}
      <Text maxFontSizeMultiplier={1.5} style={[styles.label, compact && styles.compactLabel, { color: face.label }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: space.md + space.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    overflow: "hidden",
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: space.sm + space.xs,
    borderRadius: radius.sm,
    gap: space.xs,
  },
  bevel: {
    ...fillParent,
    borderTopWidth: 2,
    borderBottomWidth: 3,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  compactLabel: {
    fontSize: 15,
  },
  disabled: {
    opacity: 0.45,
  },
});
