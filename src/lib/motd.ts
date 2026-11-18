export interface MotdSegment {
  text: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
}

export interface MotdDisplay {
  segments: MotdSegment[];
  plain: string;
}

export type MinecraftChatComponent =
  | string
  | {
      text?: string;
      translate?: string;
      with?: MinecraftChatComponent[];
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underlined?: boolean;
      strikethrough?: boolean;
      obfuscated?: boolean;
      extra?: MinecraftChatComponent[];
    };

const LEGACY_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  dark_blue: "#0000AA",
  dark_green: "#00AA00",
  dark_aqua: "#00AAAA",
  dark_red: "#AA0000",
  dark_purple: "#AA00AA",
  gold: "#FFAA00",
  gray: "#AAAAAA",
  dark_gray: "#555555",
  blue: "#5555FF",
  green: "#55FF55",
  aqua: "#55FFFF",
  red: "#FF5555",
  light_purple: "#FF55FF",
  yellow: "#FFFF55",
  white: "#FFFFFF",
};

const DEFAULT_COLOR = "#FFFFFF";

const FORMAT_CODES = new Set(["k", "l", "m", "n", "o", "r"]);

function normalizeColor(color?: string): string | undefined {
  if (!color) {
    return undefined;
  }
  if (color.startsWith("#")) {
    if (color.length === 7) {
      return color.toLowerCase();
    }
    if (color.length === 4) {
      const [, r, g, b] = color;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return color.toLowerCase();
  }
  const named = NAMED_COLORS[color];
  if (named) {
    return named.toLowerCase();
  }
  return color;
}

function pushSegment(segments: MotdSegment[], segment: MotdSegment): void {
  if (!segment.text) {
    return;
  }
  const last = segments[segments.length - 1];
  if (
    last &&
    last.color === segment.color &&
    last.bold === segment.bold &&
    last.italic === segment.italic &&
    last.underlined === segment.underlined &&
    last.strikethrough === segment.strikethrough &&
    last.obfuscated === segment.obfuscated
  ) {
    last.text += segment.text;
    return;
  }
  segments.push(segment);
}

function flattenChat(
  component: MinecraftChatComponent,
  style: Omit<MotdSegment, "text">,
  segments: MotdSegment[],
): void {
  if (typeof component === "string") {
    pushSegment(segments, { text: component, ...style });
    return;
  }

  const nextStyle: Omit<MotdSegment, "text"> = {
    color: component.color !== undefined ? normalizeColor(component.color) : style.color,
    bold: component.bold ?? style.bold,
    italic: component.italic ?? style.italic,
    underlined: component.underlined ?? style.underlined,
    strikethrough: component.strikethrough ?? style.strikethrough,
    obfuscated: component.obfuscated ?? style.obfuscated,
  };

  if (component.text) {
    pushSegment(segments, { text: component.text, ...nextStyle });
  } else if (component.translate) {
    pushSegment(segments, { text: component.translate, ...nextStyle });
  }

  if (component.with) {
    for (const child of component.with) {
      flattenChat(child, nextStyle, segments);
    }
  }

  if (component.extra) {
    for (const child of component.extra) {
      flattenChat(child, nextStyle, segments);
    }
  }
}

export function parseLegacyMotd(raw: string): MotdDisplay {
  const segments: MotdSegment[] = [];
  let color: string | undefined = DEFAULT_COLOR;
  let bold = false;
  let italic = false;
  let underlined = false;
  let strikethrough = false;
  let obfuscated = false;

  const pushText = (text: string) => {
    pushSegment(segments, {
      text,
      color,
      bold,
      italic,
      underlined,
      strikethrough,
      obfuscated,
    });
  };

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if ((ch === "§" || ch === "\u00a7") && i + 1 < raw.length) {
      const code = raw[i + 1]?.toLowerCase() ?? "";
      i += 1;
      if (code === "x") {
        let hex = "";
        let j = i + 1;
        while (hex.length < 6 && j + 1 < raw.length) {
          const marker = raw[j];
          if (marker !== "§" && marker !== "\u00a7") {
            break;
          }
          const digit = raw[j + 1]?.toLowerCase() ?? "";
          if (!/^[0-9a-f]$/.test(digit)) {
            break;
          }
          hex += digit;
          j += 2;
        }
        if (hex.length === 6) {
          color = `#${hex}`;
          i = j - 1;
          continue;
        }
      }
      if (code === "#" && i + 6 < raw.length) {
        const hex = raw.slice(i + 1, i + 7);
        if (/^[0-9a-f]{6}$/i.test(hex)) {
          color = `#${hex.toLowerCase()}`;
          i += 6;
          continue;
        }
      }
      if (code === "r") {
        color = DEFAULT_COLOR;
        bold = false;
        italic = false;
        underlined = false;
        strikethrough = false;
        obfuscated = false;
        continue;
      }
      if (FORMAT_CODES.has(code)) {
        if (code === "k") obfuscated = true;
        if (code === "l") bold = true;
        if (code === "m") strikethrough = true;
        if (code === "n") underlined = true;
        if (code === "o") italic = true;
        continue;
      }
      if (LEGACY_COLORS[code]) {
        color = LEGACY_COLORS[code].toLowerCase();
        continue;
      }
    }
    pushText(ch ?? "");
  }

  return {
    segments,
    plain: segments.map((s) => s.text).join(""),
  };
}

export function parseJsonMotd(component: MinecraftChatComponent): MotdDisplay {
  const segments: MotdSegment[] = [];
  flattenChat(component, { color: DEFAULT_COLOR }, segments);
  return {
    segments,
    plain: segments.map((s) => s.text).join(""),
  };
}

export function parseMotd(input: string | MinecraftChatComponent): MotdDisplay {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return parseJsonMotd(JSON.parse(trimmed) as MinecraftChatComponent);
      } catch {
        return parseLegacyMotd(input);
      }
    }
    return parseLegacyMotd(input);
  }
  return parseJsonMotd(input);
}

/** Collapse segments to a single default-colored plain string (strips formatting). */
export function motdToPlain(input: string | MinecraftChatComponent): string {
  return parseMotd(input).plain;
}