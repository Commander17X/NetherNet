import { createContext, useContext } from "react";

export const colors = {
  bg: "#090B10",
  elevated: "#141820",
  card: "#1A1F2A",
  stroke: "rgba(255,255,255,0.08)",
  text: "#F4F6FA",
  secondary: "#A8B0C0",
  tertiary: "#727B8C",
  accent: "#E8A317",
  accentPressed: "#C88A0C",
  accentInk: "#1B1406",
  online: "#3DDC97",
  offline: "#F07178",
  warning: "#E8A317",
  danger: "#E85D5D",
  fill: "rgba(255,255,255,0.06)",
  fillStrong: "rgba(255,255,255,0.12)",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontNames = {
  pixel: "PressStart2P_400Regular",
};

export const FontReadyContext = createContext(false);

export function usePixelFont(): string | undefined {
  return useContext(FontReadyContext) ? fontNames.pixel : undefined;
}
