import { StyleSheet, Text, View } from "react-native";

import { colors, useBodyFont, usePixelFont } from "@/theme";

export function PixelHeart() {
  return (
    <View style={styles.heart}>
      <View style={[styles.lobe, { left: 1 }]} />
      <View style={[styles.lobe, { left: 8 }]} />
      <View style={styles.band} />
      <View style={[styles.point, { top: 6, left: 2, width: 10, backgroundColor: "#C43434" }]} />
      <View style={[styles.point, { top: 8, left: 4, width: 6, backgroundColor: "#8E2020" }]} />
      <View style={[styles.point, { top: 10, left: 6, width: 2, backgroundColor: "#6A1414" }]} />
    </View>
  );
}

export function Drumstick() {
  return (
    <View style={styles.stick}>
      <View style={styles.meat} />
      <View style={styles.bone} />
    </View>
  );
}

export function HeartRow() {
  return (
    <View style={styles.row}>
      {Array.from({ length: 10 }, (_, index) => (
        <PixelHeart key={index} />
      ))}
    </View>
  );
}

export function HungerRow() {
  return (
    <View style={styles.row}>
      {Array.from({ length: 10 }, (_, index) => (
        <Drumstick key={index} />
      ))}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const font = usePixelFont();
  return <Text style={[styles.section, { fontFamily: font }]}>{children}</Text>;
}

export function BodyText({
  children,
  color = colors.ink,
  size = 20,
}: {
  children: string;
  color?: string;
  size?: number;
}) {
  const font = useBodyFont();
  return <Text style={{ fontFamily: font, color, fontSize: size, lineHeight: size + 2 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 2,
    flexWrap: "wrap",
  },
  heart: {
    width: 14,
    height: 12,
  },
  lobe: {
    position: "absolute",
    top: 0,
    width: 5,
    height: 4,
    backgroundColor: "#FF5555",
  },
  band: {
    position: "absolute",
    top: 2,
    left: 0,
    width: 14,
    height: 4,
    backgroundColor: "#FF5555",
  },
  point: {
    position: "absolute",
    height: 2,
  },
  stick: {
    width: 14,
    height: 12,
  },
  meat: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    backgroundColor: "#E39B45",
  },
  bone: {
    position: "absolute",
    left: 0,
    bottom: 1,
    width: 8,
    height: 3,
    backgroundColor: "#F3D7A1",
  },
  section: {
    color: colors.gold,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
    marginBottom: 6,
  },
});
