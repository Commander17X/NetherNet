import { StyleSheet, Text, View } from "react-native";

import { heartsFor, roomFor } from "@/lib/lobby";
import { colors, space } from "@/theme";
import { PixelLabel } from "./PixelLabel";
import { PixelSprite } from "./PixelSprite";
import { drumstickEmpty, drumstickFull, drumstickHalf, heartEmpty, heartFull, heartHalf } from "./sprites";

export function HeartRow({ ping, pixel = 2 }: { ping: number | null | undefined; pixel?: number }) {
  const hearts = heartsFor(ping);
  const full = hearts.reduce((sum, value) => sum + value, 0) / 2;
  return (
    <View accessible accessibilityLabel={`Connection: ${full} of 10 hearts`} style={styles.row}>
      {hearts.map((value, index) => (
        <PixelSprite
          key={index}
          pixel={pixel}
          sprite={value === 2 ? heartFull : value === 1 ? heartHalf : heartEmpty}
        />
      ))}
    </View>
  );
}

export function HungerRow({ online, max, pixel = 2 }: { online: number | null; max: number | null; pixel?: number }) {
  const room = roomFor(online, max);
  const full = room.reduce((sum, value) => sum + value, 0) / 2;
  return (
    <View accessible accessibilityLabel={`Free slots: ${full} of 10`} style={[styles.row, styles.reverse]}>
      {room.map((value, index) => (
        <PixelSprite
          key={index}
          pixel={pixel}
          sprite={value === 2 ? drumstickFull : value === 1 ? drumstickHalf : drumstickEmpty}
        />
      ))}
    </View>
  );
}

export function VitalsPanel({
  ping,
  online,
  max,
}: {
  ping: number | null | undefined;
  online: number | null;
  max: number | null;
}) {
  const free = online == null || max == null ? null : Math.max(0, max - online);
  return (
    <View style={styles.vitals}>
      <View style={styles.vital}>
        <PixelLabel size={8} color={colors.heart} style={styles.vitalLabel}>
          SIGNAL
        </PixelLabel>
        <HeartRow ping={ping} />
        <Text style={styles.value}>{ping == null ? "--" : `${ping} ms`}</Text>
      </View>
      <View style={styles.vital}>
        <PixelLabel size={8} color={colors.hunger} style={styles.vitalLabel}>
          ROOM
        </PixelLabel>
        <HungerRow online={online} max={max} />
        <Text style={styles.value}>{free == null ? "--" : `${free.toLocaleString("en-US")} free`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 1,
  },
  reverse: {
    flexDirection: "row-reverse",
  },
  vitals: {
    gap: space.sm + space.xs,
  },
  vital: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  vitalLabel: {
    width: 56,
  },
  value: {
    flex: 1,
    textAlign: "right",
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
