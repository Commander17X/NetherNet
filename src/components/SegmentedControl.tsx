import { Pressable, StyleSheet, Text, View } from "react-native";

import { tap } from "@/lib/haptics";
import { colors, radius, space } from "@/theme";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              tap("light");
              onChange(option.value);
            }}
            style={[styles.item, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: colors.fill,
    borderRadius: radius.md,
    padding: 3,
    gap: 2,
  },
  item: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.sm,
  },
  selected: {
    backgroundColor: colors.card,
  },
  label: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedLabel: {
    color: colors.text,
  },
});
