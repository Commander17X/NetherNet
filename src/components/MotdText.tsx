import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import type { MotdLine } from "@/lib/motd";
import { colors } from "@/theme";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

function scramble(text: string, tick: number): string {
  return text
    .split("")
    .map((char, index) => (char === " " ? " " : (GLYPHS[(char.charCodeAt(0) + tick + index) % GLYPHS.length] ?? "X")))
    .join("");
}

function tidyLine(line: MotdLine, keepSpacing: boolean): MotdLine {
  if (keepSpacing) {
    return line;
  }
  const spans = line.map((span) => ({ ...span }));
  while (spans.length > 0 && spans[0].text.trim() === "") {
    spans.shift();
  }
  if (spans[0]) {
    spans[0].text = spans[0].text.replace(/^\s+/, "");
  }
  return spans;
}

export function MotdText({
  lines,
  dim = false,
  linesToShow = 2,
  size = 15,
  centered = false,
  emptyText,
}: {
  lines: MotdLine[];
  dim?: boolean;
  linesToShow?: number;
  size?: number;
  centered?: boolean;
  emptyText?: string;
}) {
  const shown = lines
    .map((line) => tidyLine(line, centered))
    .filter((line) => line.some((span) => span.text.trim() !== ""))
    .slice(0, linesToShow);
  const obfuscated = shown.some((line) => line.some((span) => span.obfuscated));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!obfuscated) {
      return;
    }
    const timer = setInterval(() => setTick((value) => value + 1), 180);
    return () => clearInterval(timer);
  }, [obfuscated]);

  const textStyle = {
    fontSize: size,
    lineHeight: Math.round(size * 1.35),
    textAlign: centered ? ("center" as const) : ("left" as const),
  };

  if (shown.length === 0) {
    return (
      <Text style={[styles.empty, textStyle]}>
        {emptyText ?? (dim ? "No message of the day" : "Waiting for the server")}
      </Text>
    );
  }

  return (
    <Text style={[styles.block, textStyle]} numberOfLines={linesToShow}>
      {shown.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {lineIndex > 0 ? "\n" : ""}
          {line.map((span, spanIndex) => (
            <Text
              key={spanIndex}
              style={{
                color: dim ? colors.tertiary : span.color,
                fontWeight: span.bold ? "800" : "500",
                fontStyle: span.italic ? "italic" : "normal",
                textDecorationLine:
                  span.underlined && span.strikethrough
                    ? "underline line-through"
                    : span.underlined
                      ? "underline"
                      : span.strikethrough
                        ? "line-through"
                        : "none",
              }}
            >
              {span.obfuscated ? scramble(span.text, tick) : span.text}
            </Text>
          ))}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  block: {
    color: colors.text,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  empty: {
    color: colors.tertiary,
  },
});
