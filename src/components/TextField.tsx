import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

type Props = TextInputProps & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={tubnetColors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: tubnetSpacing.xs,
    marginBottom: tubnetSpacing.md,
  },
  label: {
    fontFamily: tubnetFonts.display,
    fontSize: 8,
    color: tubnetColors.textMuted,
  },
  input: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: tubnetColors.text,
    borderWidth: 1,
    borderColor: tubnetColors.panelBorder,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 6,
    paddingHorizontal: tubnetSpacing.md,
    paddingVertical: tubnetSpacing.sm,
  },
  hint: {
    fontFamily: tubnetFonts.body,
    fontSize: 16,
    color: tubnetColors.textMuted,
  },
});