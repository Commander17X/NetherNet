import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { tap } from "@/lib/haptics";
import { colors, radius, space } from "@/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const faces: Record<Variant, { background: string; label: string; border: string }> = {
  primary: { background: colors.accent, label: colors.accentInk, border: "transparent" },
  secondary: { background: colors.fill, label: colors.text, border: colors.stroke },
  ghost: { background: "transparent", label: colors.secondary, border: "transparent" },
  danger: { background: "rgba(232,93,93,0.14)", label: colors.danger, border: "transparent" },
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  compact?: boolean;
}) {
  const face = faces[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        tap(variant === "primary" ? "medium" : "light");
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor: pressed && !disabled ? shade(face.background) : face.background,
          borderColor: face.border,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, compact && styles.compactLabel, { color: face.label }]}>{label}</Text>
    </Pressable>
  );
}

function shade(color: string): string {
  if (color === colors.accent) {
    return colors.accentPressed;
  }
  return colors.fillStrong;
}

export function Stack({ children, gap = space.md, style }: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: space.sm + 4,
    borderRadius: radius.sm,
  },
  label: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  compactLabel: {
    fontSize: 15,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
