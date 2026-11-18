import { createContext, useContext } from "react";

export const colors = {
  bg: "#0B1020",
  sky: "#1B3E73",
  panel: "rgba(10, 14, 26, 0.78)",
  panelSolid: "#12182A",
  ink: "#F4F7FF",
  muted: "#B7C0D4",
  gold: "#FFAA00",
  aqua: "#55FFFF",
  green: "#55FF55",
  red: "#FF5555",
  yellow: "#FFFF55",
  purple: "#FF55FF",
  gray: "#AAAAAA",
  dark: "#555555",
  white: "#FFFFFF",
  black: "#05070D",
  slot: "#171D2E",
  grass: "#3E7A34",
  dirt: "#6B4624",
  nether: "#7A2438",
  stone: "#6E7688",
};

export const fontNames = {
  pixel: "PressStart2P_400Regular",
  body: "VT323_400Regular",
};

export const FontReadyContext = createContext(false);

export function usePixelFont(): string | undefined {
  return useContext(FontReadyContext) ? fontNames.pixel : undefined;
}

export function useBodyFont(): string | undefined {
  return useContext(FontReadyContext) ? fontNames.body : undefined;
}
