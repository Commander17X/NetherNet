import { StyleSheet, type TextStyle, type ViewStyle } from "react-native";

/** TubNet-inspired dark glass + pixel accent palette. */
export const tubnetColors = {
  bg: "#06060c",
  bgGradientTop: "#0c0c16",
  panel: "rgba(18, 20, 32, 0.72)",
  panelBorder: "rgba(120, 140, 255, 0.22)",
  panelHighlight: "rgba(140, 160, 255, 0.08)",
  text: "#e8eaf6",
  textMuted: "#8b93b8",
  accent: "#7c9cff",
  accentDark: "#4a5fc1",
  success: "#5ce0a8",
  danger: "#ff6b7a",
  warning: "#ffc857",
  pixelShadow: "#1a1f3a",
  featured: "#9d7cff",
} as const;

export const tubnetFonts = {
  display: "PressStart2P_400Regular",
  body: "VT323_400Regular",
} as const;

export const tubnetSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const tubnetRadii = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export function glassPanel(): ViewStyle {
  return {
    backgroundColor: tubnetColors.panel,
    borderWidth: 1,
    borderColor: tubnetColors.panelBorder,
    borderRadius: tubnetRadii.md,
    overflow: "hidden",
  };
}

export const tubnetText = StyleSheet.create({
  title: {
    fontFamily: tubnetFonts.display,
    fontSize: 12,
    color: tubnetColors.text,
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: tubnetColors.textMuted,
    lineHeight: 24,
  },
  body: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.text,
    lineHeight: 22,
  },
  label: {
    fontFamily: tubnetFonts.body,
    fontSize: 18,
    color: tubnetColors.textMuted,
    lineHeight: 20,
  },
});

export function pixelButtonBase(variant: "primary" | "ghost" | "danger" = "primary"): ViewStyle {
  const bg =
    variant === "primary"
      ? tubnetColors.accent
      : variant === "danger"
        ? tubnetColors.danger
        : "transparent";
  return {
    backgroundColor: bg,
    borderWidth: 2,
    borderColor: variant === "ghost" ? tubnetColors.panelBorder : tubnetColors.pixelShadow,
    borderRadius: tubnetRadii.sm,
    paddingVertical: tubnetSpacing.sm,
    paddingHorizontal: tubnetSpacing.md,
    // pixel offset shadow
    shadowColor: tubnetColors.pixelShadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: variant === "ghost" ? 0.4 : 0.9,
    shadowRadius: 0,
    elevation: 0,
  };
}

export function pixelButtonText(variant: "primary" | "ghost" | "danger" = "primary"): TextStyle {
  return {
    fontFamily: tubnetFonts.display,
    fontSize: 10,
    color: variant === "ghost" ? tubnetColors.text : "#0a0a12",
    textAlign: "center",
  };
}