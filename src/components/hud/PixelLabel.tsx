import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";

import { colors, usePixelFont } from "@/theme";

export function PixelLabel({
  children,
  color = colors.accent,
  size = 9,
  style,
  shadow = false,
}: {
  children: string;
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
  shadow?: boolean;
}) {
  const pixel = usePixelFont();
  return (
    <Text
      maxFontSizeMultiplier={1.25}
      style={[
        styles.label,
        { color, fontSize: size, lineHeight: Math.round(size * 1.6), fontFamily: pixel },
        !pixel && styles.fallback,
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    letterSpacing: 0.5,
  },
  fallback: {
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  shadow: {
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
