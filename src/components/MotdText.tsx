import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import type { MotdLine } from "@/lib/motd";
import { colors, useBodyFont } from "@/theme";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

function scramble(text: string, tick: number): string {
  return text
    .split("")
    .map((char, index) => {
      if (char === " ") {
        return " ";
      }
      const pick = (char.charCodeAt(0) + tick + index) % GLYPHS.length;
      return GLYPHS[pick] ?? "X";
    })
    .join("");
}

export function MotdText({ lines, dim = false }: { lines: MotdLine[]; dim?: boolean }) {
  const font = useBodyFont();
  const obfuscated = lines.some((line) => line.some((span) => span.obfuscated));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!obfuscated) {
      return;
    }
    const timer = setInterval(() => setTick((value) => value + 1), 180);
    return () => clearInterval(timer);
  }, [obfuscated]);

  if (lines.length === 0) {
    return <Text style={[styles.empty, { fontFamily: font }]}>{dim ? "No description" : "Waiting for MOTD"}</Text>;
  }

  return (
    <Text style={[styles.block, { fontFamily: font }]}>
      {lines.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {lineIndex > 0 ? "\n" : ""}
          {line.map((span, spanIndex) => (
            <Text
              key={spanIndex}
              style={{
                color: span.color,
                fontFamily: font,
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
    color: colors.white,
    fontSize: 20,
    lineHeight: 22,
  },
  empty: {
    color: colors.gray,
    fontSize: 18,
    lineHeight: 22,
  },
});
