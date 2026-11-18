import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

import { pixelButtonBase, pixelButtonText } from "@/theme/tubnet";

type Variant = "primary" | "ghost" | "danger";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  small?: boolean;
};

export function PixelButton({ label, variant = "primary", small, style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => {
        const base = [
          styles.btn,
          pixelButtonBase(variant),
          small && styles.small,
          state.pressed && styles.pressed,
        ];
        if (typeof style === "function") {
          const extra = style(state);
          return [...base, extra];
        }
        return [...base, style];
      }}
      {...rest}
    >
      <Text style={[pixelButtonText(variant), small && styles.smallText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowOffset: { width: 0, height: 0 },
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallText: {
    fontSize: 8,
  },
});