import { StyleSheet, Text, View } from "react-native";

import type { MotdDisplay } from "@/lib/motd";
import { tubnetFonts } from "@/theme/tubnet";

type Props = {
  motd?: MotdDisplay;
  fallback?: string;
};

export function MotdText({ motd, fallback = "No MOTD" }: Props) {
  if (!motd || motd.segments.length === 0) {
    return <Text style={styles.plain}>{fallback}</Text>;
  }

  return (
    <View style={styles.row}>
      {motd.segments.map((seg, i) => (
        <Text
          key={`${i}-${seg.text.slice(0, 8)}`}
          style={[
            styles.segment,
            seg.color ? { color: seg.color } : undefined,
            seg.bold ? styles.bold : undefined,
            seg.italic ? styles.italic : undefined,
            seg.underlined ? styles.underline : undefined,
            seg.strikethrough ? styles.strike : undefined,
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  segment: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: "#e8eaf6",
    lineHeight: 24,
  },
  plain: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: "#8b93b8",
    lineHeight: 24,
  },
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecorationLine: "underline",
  },
  strike: {
    textDecorationLine: "line-through",
  },
});