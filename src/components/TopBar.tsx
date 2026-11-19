import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tap } from "@/lib/haptics";
import { colors, radius, space } from "@/theme";

export function RoundButton({
  icon,
  label,
  onPress,
  color = colors.text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap("light");
        onPress();
      }}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function TopBar({ title, onBack, trailing }: { title?: string; onBack: () => void; trailing?: ReactNode }) {
  return (
    <View style={styles.bar}>
      <RoundButton icon="chevron-back" label="Back" onPress={onBack} />
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.trailing}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  pressed: {
    backgroundColor: colors.fillStrong,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  spacer: {
    flex: 1,
  },
  trailing: {
    minWidth: 40,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: space.sm,
  },
});
