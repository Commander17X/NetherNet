import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, space } from "@/theme";

export function TextField({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string | null; error?: string | null }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        {...input}
        style={[styles.input, error ? styles.inputError : null, input.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.sm,
  },
  label: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.fill,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: colors.danger,
  },
  hint: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
