import { createContext, useContext } from "react";
import { Platform } from "react-native";

export const colors = {
  bg: "#06080C",
  bgRaised: "#0B0E14",
  elevated: "#11151D",
  card: "#141922",
  cardHigh: "#1B212C",
  panel: "rgba(12,15,21,0.78)",
  stroke: "rgba(255,255,255,0.08)",
  strokeStrong: "rgba(255,255,255,0.16)",
  bevelLight: "rgba(255,255,255,0.10)",
  bevelDark: "rgba(0,0,0,0.45)",
  text: "#F5F7FB",
  secondary: "#AEB6C5",
  tertiary: "#8A94A6",
  placeholder: "#6B7485",
  accent: "#F5B21B",
  accentPressed: "#D4960B",
  accentSoft: "rgba(245,178,27,0.14)",
  accentInk: "#1C1404",
  xp: "#7CF03A",
  xpDeep: "#3E8E12",
  heart: "#FF4757",
  hunger: "#D9893B",
  score: "#FF5555",
  online: "#43E08C",
  offline: "#FF6B74",
  warning: "#F5B21B",
  danger: "#FF5C5C",
  dangerSoft: "rgba(255,92,92,0.14)",
  fill: "rgba(255,255,255,0.06)",
  fillStrong: "rgba(255,255,255,0.11)",
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  pixel: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typeScale = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "800" as const, letterSpacing: -1 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "800" as const, letterSpacing: -0.7 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.4 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "700" as const, letterSpacing: -0.3 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: "400" as const },
  callout: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: "600" as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const },
};

export const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "ui-monospace, Menlo, monospace" });

export const fontNames = {
  pixel: "PressStart2P_400Regular",
};

export const FontReadyContext = createContext(false);

export function usePixelFont(): string | undefined {
  return useContext(FontReadyContext) ? fontNames.pixel : undefined;
}

export const contentWidth = 720;

export const fillParent = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
