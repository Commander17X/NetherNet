import { StyleSheet, View } from "react-native";

import { colors } from "@/theme";

type Block = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  size: number;
  color: string;
};

const BLOCKS: Block[] = [
  { top: 18, left: -20, size: 86, color: colors.grass },
  { top: 70, left: 40, size: 46, color: colors.dirt },
  { top: 8, right: -10, size: 70, color: colors.stone },
  { top: 240, left: -30, size: 110, color: colors.nether },
  { top: 420, right: -24, size: 90, color: colors.grass },
  { bottom: 120, left: 24, size: 54, color: colors.stone },
  { bottom: 40, right: 30, size: 72, color: colors.dirt },
];

export function BlockBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.sky} />
      <View style={styles.fade} />
      {BLOCKS.map((block, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            top: block.top,
            bottom: block.bottom,
            left: block.left,
            right: block.right,
            width: block.size,
            height: block.size,
            backgroundColor: block.color,
            opacity: 0.28,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
  },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 220,
    backgroundColor: colors.sky,
    opacity: 0.35,
  },
});
