import { createContext, useContext } from "react";
import { Platform } from "react-native";

export const colors = {
  bg: "#120D09",
  bgRaised: "#17110C",
  elevated: "#1D150F",
  card: "#211810",
  cardHigh: "#2A1F16",
  panel: "rgba(22,15,10,0.84)",
  stroke: "rgba(255,236,214,0.08)",
  strokeStrong: "rgba(255,236,214,0.16)",
  edge: "#050302",
  bevelLight: "rgba(255,236,214,0.10)",
  bevelDark: "rgba(0,0,0,0.45)",
  text: "#FBF6EF",
  secondary: "#D4C6B5",
  tertiary: "#A8988A",
  placeholder: "#7E6F62",
  accent: "#E2552A",
  accentFill: "#C94518",
  accentPressed: "#A93912",
  accentSoft: "rgba(226,85,42,0.12)",
  accentLine: "rgba(226,85,42,0.34)",
  accentInk: "#FFFFFF",
  grass: "#77BE40",
  grassDeep: "#3E6B1E",
  dirt: "#7A5233",
  xp: "#7CF03A",
  xpDeep: "#3E8E12",
  heart: "#FF4757",
  hunger: "#D9893B",
  score: "#FF5555",
  online: "#6FDC5B",
  offline: "#FF6B5C",
  warning: "#F5B21B",
  danger: "#FF5C5C",
  dangerSoft: "rgba(255,92,92,0.14)",
  fill: "rgba(255,236,214,0.06)",
  fillStrong: "rgba(255,236,214,0.11)",
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
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
