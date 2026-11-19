import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";

import type { FeedItem, FeedTone } from "@/lib/lobby";
import { colors, space } from "@/theme";
import { PixelLabel } from "./PixelLabel";

const TONES: Record<FeedTone, { tag: string; color: string }> = {
  online: { tag: "UP", color: colors.online },
  offline: { tag: "DOWN", color: colors.offline },
  spike: { tag: "HOT", color: colors.accent },
  ping: { tag: "PING", color: "#55FFFF" },
  info: { tag: "INFO", color: colors.secondary },
};

function ago(at: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 45) {
    return "now";
  }
  const minutes = Math.round(seconds / 60);
  return minutes < 60 ? `${minutes}m` : `${Math.round(minutes / 60)}h`;
}

export function ChatFeed({ items, waiting }: { items: FeedItem[]; waiting: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (items.length === 0) {
    return (
      <View style={styles.line}>
        <PixelLabel size={7} color={colors.tertiary} style={styles.tag}>
          LIVE
        </PixelLabel>
        <Text style={styles.waiting}>{waiting ? "Pinging servers..." : "All quiet. Updates show up here."}</Text>
      </View>
    );
  }

  return (
    <View accessibilityLiveRegion="polite" style={styles.list}>
      {items.map((item, index) => {
        const tone = TONES[item.tone];
        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(280)}
            exiting={FadeOut.duration(180)}
            layout={LinearTransition.duration(240)}
            accessible
            accessibilityLabel={`${item.serverName} ${item.text}`}
            style={[styles.line, { opacity: 1 - index * 0.16 }]}
          >
            <PixelLabel size={7} color={tone.color} style={styles.tag}>
              {tone.tag}
            </PixelLabel>
            <Text style={styles.text} numberOfLines={1}>
              <Text style={styles.name}>{item.serverName}</Text> <Text style={{ color: tone.color }}>{item.text}</Text>
            </Text>
            <Text style={styles.time}>{ago(item.at, now)}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: space.xs,
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 36,
    paddingHorizontal: space.sm + space.xs,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tag: {
    width: 36,
  },
  text: {
    flex: 1,
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 19,
  },
  name: {
    color: colors.text,
    fontWeight: "700",
  },
  waiting: {
    flex: 1,
    color: colors.tertiary,
    fontSize: 14,
  },
  time: {
    color: colors.tertiary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
