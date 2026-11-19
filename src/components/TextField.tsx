import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors, radius, space } from "@/theme";

export type FieldState = "idle" | "valid" | "invalid";

export function TextField({
  label,
  hint,
  error,
  state = "idle",
  ...input
}: TextInputProps & { label: string; hint?: string | null; error?: string | null; state?: FieldState }) {
  const [focused, setFocused] = useState(false);
  const shown: FieldState = error ? "invalid" : state;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.box,
          focused && styles.focused,
          shown === "invalid" && styles.invalid,
          shown === "valid" && !focused && styles.valid,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? hint ?? undefined}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.accent}
          {...input}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
          style={[styles.input, input.style]}
        />
        {shown !== "idle" ? (
          <Ionicons
            name={shown === "valid" ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={shown === "valid" ? colors.online : colors.danger}
            accessibilityElementsHidden
          />
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
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
    letterSpacing: 0.2,
  },
  box: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingRight: space.md,
  },
  focused: {
    borderColor: colors.accent,
    backgroundColor: "rgba(245,178,27,0.06)",
  },
  invalid: {
    borderColor: colors.danger,
  },
  valid: {
    borderColor: "rgba(67,224,140,0.45)",
  },
  input: {
    flex: 1,
    minHeight: 50,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: space.md,
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
    fontWeight: "500",
  },
});
