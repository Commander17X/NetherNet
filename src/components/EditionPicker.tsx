import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Edition } from "@/lib/types";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

type Props = {
  value: Edition;
  onChange: (edition: Edition) => void;
};

export function EditionPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {(["java", "bedrock"] as const).map((edition) => {
        const active = value === edition;
        return (
          <Pressable
            key={edition}
            accessibilityRole="button"
            onPress={() => onChange(edition)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {edition === "java" ? "JAVA" : "BEDROCK"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: tubnetSpacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: tubnetSpacing.sm,
    borderWidth: 2,
    borderColor: tubnetColors.panelBorder,
    borderRadius: 4,
    alignItems: "center",
  },
  chipActive: {
    borderColor: tubnetColors.accent,
    backgroundColor: tubnetColors.panelHighlight,
  },
  chipText: {
    fontFamily: tubnetFonts.display,
    fontSize: 8,
    color: tubnetColors.textMuted,
  },
  chipTextActive: {
    color: tubnetColors.accent,
  },
});