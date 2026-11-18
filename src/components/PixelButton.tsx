import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, usePixelFont } from "@/theme";

type Tone = "gold" | "green" | "aqua" | "red" | "stone";

const tones: Record<Tone, { face: string; edge: string; label: string }> = {
  gold: { face: "#C48414", edge: "#6A4208", label: "#1A1000" },
  green: { face: "#3C8C32", edge: "#1C4016", label: "#061206" },
  aqua: { face: "#2F8C9A", edge: "#123E48", label: "#041418" },
  red: { face: "#A33A3A", edge: "#4E1616", label: "#1A0606" },
  stone: { face: "#3A4258", edge: "#151924", label: colors.ink },
};

export function PixelButton({
  label,
  onPress,
  tone = "gold",
  disabled = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  compact?: boolean;
}) {
  const font = usePixelFont();
  const palette = tones[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <View style={[styles.edge, { backgroundColor: palette.edge }, compact && styles.compactEdge]}>
        <View style={[styles.face, { backgroundColor: palette.face }, compact && styles.compactFace]}>
          <Text style={[styles.label, { color: palette.label, fontFamily: font }, compact && styles.compactLabel]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: {
    paddingBottom: 4,
    paddingRight: 3,
  },
  face: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  compactEdge: {
    paddingBottom: 3,
  },
  compactFace: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  compactLabel: {
    fontSize: 8,
    lineHeight: 12,
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
