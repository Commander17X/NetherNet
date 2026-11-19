import { colors } from "@/theme";
import type { SpriteMap } from "./PixelSprite";

const HEART_ROWS = [
  ".OO...OO.",
  "OHHO.OFFO",
  "OHFFOFFFO",
  "OFFFFFFFO",
  ".OFFFFFO.",
  "..OFFFO..",
  "...OFO...",
  "....O....",
];

const HALF_HEART_ROWS = [
  ".OO...OO.",
  "OHHO.OEEO",
  "OHFFOEEEO",
  "OFFFEEEEO",
  ".OFFEEEO.",
  "..OFEEO..",
  "...OEO...",
  "....O....",
];

const OUTLINE = "#14070A";
const EMPTY = "#2A2F3A";

export const heartFull: SpriteMap = {
  rows: HEART_ROWS,
  palette: { O: OUTLINE, H: "#FFC2C8", F: colors.heart },
};

export const heartHalf: SpriteMap = {
  rows: HALF_HEART_ROWS,
  palette: { O: OUTLINE, H: "#FFC2C8", F: colors.heart, E: EMPTY },
};

export const heartEmpty: SpriteMap = {
  rows: HEART_ROWS,
  palette: { O: OUTLINE, H: EMPTY, F: EMPTY },
};

const DRUMSTICK_ROWS = [
  "....OOOO.",
  "...OMMMMO",
  "..OMMHMMO",
  "..OMMMMMO",
  "..OMMMMO.",
  ".OWOOOO..",
  "OWWO.....",
  ".OO......",
];

const HALF_DRUMSTICK_ROWS = [
  "....OOOO.",
  "...OEEEEO",
  "..OMMEEEO",
  "..OMMEEEO",
  "..OMMEEO.",
  ".OWOOOO..",
  "OWWO.....",
  ".OO......",
];

export const drumstickFull: SpriteMap = {
  rows: DRUMSTICK_ROWS,
  palette: { O: "#1A0F06", M: colors.hunger, H: "#F4C08A", W: "#F1E9DA" },
};

export const drumstickHalf: SpriteMap = {
  rows: HALF_DRUMSTICK_ROWS,
  palette: { O: "#1A0F06", M: colors.hunger, E: EMPTY, W: "#F1E9DA" },
};

export const drumstickEmpty: SpriteMap = {
  rows: DRUMSTICK_ROWS,
  palette: { O: "#1A0F06", M: EMPTY, H: EMPTY, W: "#3A3F4A" },
};

export const starSprite: SpriteMap = {
  rows: [
    "....O....",
    "...OYO...",
    "...OYO...",
    "OOOOYOOOO",
    ".OYYYYYO.",
    "..OYYYO..",
    "..OYOYO..",
    ".OYO.OYO.",
    ".OO...OO.",
  ],
  palette: { O: "#2A1A00", Y: colors.accent },
};

export const plusSprite: SpriteMap = {
  rows: [
    "...OOO...",
    "...OGO...",
    "...OGO...",
    "OOOOGOOOO",
    "OGGGGGGGO",
    "OOOOGOOOO",
    "...OGO...",
    "...OGO...",
    "...OOO...",
  ],
  palette: { O: "#0E2A05", G: colors.xp },
};
