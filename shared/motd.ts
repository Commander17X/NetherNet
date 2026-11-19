export type MotdSpan = {
  text: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underlined: boolean;
  strikethrough: boolean;
  obfuscated: boolean;
};

export type MotdLine = MotdSpan[];

export const MOTD_COLORS: Record<string, string> = {
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
  black: MOTD_COLORS["0"],
  dark_blue: MOTD_COLORS["1"],
  dark_green: MOTD_COLORS["2"],
  dark_aqua: MOTD_COLORS["3"],
  dark_red: MOTD_COLORS["4"],
  dark_purple: MOTD_COLORS["5"],
  gold: MOTD_COLORS["6"],
  gray: MOTD_COLORS["7"],
  grey: MOTD_COLORS["7"],
  dark_gray: MOTD_COLORS["8"],
  dark_grey: MOTD_COLORS["8"],
  blue: MOTD_COLORS["9"],
  green: MOTD_COLORS.a,
  aqua: MOTD_COLORS.b,
  red: MOTD_COLORS.c,
  light_purple: MOTD_COLORS.d,
  yellow: MOTD_COLORS.e,
  white: MOTD_COLORS.f,
};

type Style = Omit<MotdSpan, "text">;

function freshStyle(): Style {
  return {
    color: "#FFFFFF",
    bold: false,
    italic: false,
    underlined: false,
    strikethrough: false,
    obfuscated: false,
  };
}

function cloneStyle(style: Style): Style {
  return { ...style };
}

export function parseMotd(input: unknown): MotdLine[] {
  if (input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    if (input.every((item) => typeof item === "string")) {
      return cleanup(parseLegacy(input.join("\n"), freshStyle()));
    }
    const lines: MotdLine[] = [[]];
    for (const item of input) {
      appendComponent(item, freshStyle(), lines);
    }
    return cleanup(lines);
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return parseMotd(JSON.parse(trimmed) as unknown);
      } catch {
        return cleanup(parseLegacy(input, freshStyle()));
      }
    }
    return cleanup(parseLegacy(input, freshStyle()));
  }

  if (typeof input === "object") {
    const lines: MotdLine[] = [[]];
    appendComponent(input, freshStyle(), lines);
    return cleanup(lines);
  }

  return [];
}

export function motdPlain(lines: MotdLine[]): string {
  return lines
    .map((line) => line.map((span) => span.text).join(""))
    .join("\n")
    .trim();
}

function cleanup(lines: MotdLine[]): MotdLine[] {
  const cleaned = lines
    .map((line) => line.filter((span) => span.text.length > 0))
    .filter((line, index, all) => line.length > 0 || index < all.length - 1);

  while (cleaned.length > 0 && cleaned[cleaned.length - 1].length === 0) {
    cleaned.pop();
  }
  while (cleaned.length > 0 && cleaned[0].length === 0) {
    cleaned.shift();
  }
  return cleaned;
}

function appendSpan(lines: MotdLine[], text: string, style: Style) {
  if (!text) {
    return;
  }
  const parts = text.split("\n");
  parts.forEach((part, index) => {
    if (index > 0) {
      lines.push([]);
    }
    if (part) {
      lines[lines.length - 1].push({ text: part, ...style });
    }
  });
}

function parseLegacy(input: string, initial: Style): MotdLine[] {
  const lines: MotdLine[] = [[]];
  let style = cloneStyle(initial);
  let buffer = "";

  const flush = () => {
    if (!buffer) {
      return;
    }
    lines[lines.length - 1].push({ text: buffer, ...style });
    buffer = "";
  };

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === "\n") {
      flush();
      lines.push([]);
      continue;
    }

    if ((ch === "§" || ch === "&") && i + 1 < input.length) {
      const next = input[i + 1];
      if (ch === "&" && next === "#" && i + 8 <= input.length) {
        const hex = input.slice(i + 2, i + 8);
        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
          flush();
          style = { ...style, color: `#${hex.toUpperCase()}` };
          i += 7;
          continue;
        }
      }

      const code = next.toLowerCase();
      if (code === "x") {
        const hex = readLegacyHex(input, i, ch);
        if (hex) {
          flush();
          style = { ...style, color: hex.color };
          i = hex.nextIndex - 1;
          continue;
        }
      }

      if (MOTD_COLORS[code]) {
        flush();
        style = { ...style, color: MOTD_COLORS[code] };
        i += 1;
        continue;
      }

      if (code === "l" || code === "m" || code === "n" || code === "o" || code === "k" || code === "r") {
        flush();
        if (code === "r") {
          style = freshStyle();
        } else if (code === "l") {
          style = { ...style, bold: true };
        } else if (code === "m") {
          style = { ...style, strikethrough: true };
        } else if (code === "n") {
          style = { ...style, underlined: true };
        } else if (code === "o") {
          style = { ...style, italic: true };
        } else if (code === "k") {
          style = { ...style, obfuscated: true };
        }
        i += 1;
        continue;
      }
    }

    buffer += ch;
  }

  flush();
  return lines;
}

function readLegacyHex(
  input: string,
  start: number,
  marker: string,
): { color: string; nextIndex: number } | null {
  let cursor = start + 2;
  let hex = "";
  for (let n = 0; n < 6; n += 1) {
    if (input[cursor] !== marker) {
      return null;
    }
    const digit = input[cursor + 1];
    if (!digit || !/^[0-9a-fA-F]$/.test(digit)) {
      return null;
    }
    hex += digit;
    cursor += 2;
  }
  return { color: `#${hex.toUpperCase()}`, nextIndex: cursor };
}

function appendComponent(node: unknown, inherited: Style, lines: MotdLine[]) {
  if (node == null) {
    return;
  }
  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    const parsed = parseLegacy(String(node), inherited);
    mergeLines(lines, parsed);
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      appendComponent(child, inherited, lines);
    }
    return;
  }
  if (typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;
  const style = styleFromComponent(inherited, record);

  if (typeof record.text === "string") {
    const parsed = parseLegacy(record.text, style);
    mergeLines(lines, parsed);
  }

  if (typeof record.translate === "string") {
    appendTranslate(record.translate, Array.isArray(record.with) ? record.with : [], style, lines);
  }

  if (Array.isArray(record.extra)) {
    for (const extra of record.extra) {
      appendComponent(extra, style, lines);
    }
  }
}

function mergeLines(target: MotdLine[], source: MotdLine[]) {
  if (source.length === 0) {
    return;
  }
  const [first, ...rest] = source;
  if (first) {
    target[target.length - 1].push(...first);
  }
  for (const line of rest) {
    target.push(line);
  }
}

function styleFromComponent(inherited: Style, record: Record<string, unknown>): Style {
  const next = cloneStyle(inherited);
  if (typeof record.color === "string") {
    const color = resolveColor(record.color);
    if (color) {
      next.color = color;
    } else if (record.color.toLowerCase() === "reset") {
      return freshStyle();
    }
  }

  next.bold = flag(record.bold, next.bold);
  next.italic = flag(record.italic, next.italic);
  next.underlined = flag(record.underlined, next.underlined);
  next.strikethrough = flag(record.strikethrough, next.strikethrough);
  next.obfuscated = flag(record.obfuscated, next.obfuscated);
  return next;
}

function flag(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function resolveColor(value: string): string | null {
  const named = NAMED_COLORS[value.toLowerCase()];
  if (named) {
    return named;
  }
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toUpperCase();
  }
  return null;
}

function appendTranslate(key: string, args: unknown[], style: Style, lines: MotdLine[]) {
  const pattern = /%(?:(\d+)\$)?s/g;
  let last = 0;
  let autoIndex = 0;
  let matched = false;
  let found: RegExpExecArray | null;

  while ((found = pattern.exec(key)) !== null) {
    matched = true;
    appendSpan(lines, key.slice(last, found.index), style);
    const index = found[1] ? Number(found[1]) - 1 : autoIndex;
    if (!found[1]) {
      autoIndex += 1;
    }
    const arg = args[index];
    if (arg !== undefined) {
      appendComponent(arg, style, lines);
    }
    last = found.index + found[0].length;
  }

  const tail = key.slice(last);
  if (matched) {
    appendSpan(lines, tail, style);
    return;
  }

  const looksLikeKey = /^[a-z0-9_.-]+$/i.test(key) && key.includes(".");
  if (!looksLikeKey) {
    appendSpan(lines, key, style);
  }
  for (const arg of args) {
    appendComponent(arg, style, lines);
  }
}
