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

export function MotdText({ lines, dim = false, linesToShow = 2 }: { lines: MotdLine[]; dim?: boolean; linesToShow?: number }) {
  const shown = lines.slice(0, linesToShow);
  const obfuscated = shown.some((line) => line.some((span) => span.obfuscated));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!obfuscated) {
      return;
    }
    const timer = setInterval(() => setTick((value) => value + 1), 180);
    return () => clearInterval(timer);
  }, [obfuscated]);

  if (shown.length === 0) {
    return <Text style={styles.empty}>{dim ? "No description" : "Waiting for the server list"}</Text>;
  }

  return (
    <Text style={styles.block} numberOfLines={linesToShow}>
      {shown.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {lineIndex > 0 ? "\n" : ""}
          {line.map((span, spanIndex) => (
            <Text
              key={spanIndex}
              style={{
                color: dim ? colors.tertiary : span.color,
                fontWeight: span.bold ? "700" : "400",
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
    fontSize: 15,
    lineHeight: 20,
  },
  empty: {
    color: colors.tertiary,
    fontSize: 15,
    lineHeight: 20,
  },
});
