import { ReactNode } from "react";
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { textures } from "./textures";

const EDGE_HEIGHT = 32;
const WORDMARK_RATIO = 924 / 156;

export function Tiled({
  source,
  style,
  children,
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <View style={style}>
      <Image source={source} resizeMode="repeat" style={styles.fill} accessibilityIgnoresInvertColors />
      {children}
    </View>
  );
}

/** A dark dirt band behind the top of a screen, with a ragged pixel edge at the bottom. */
export function DirtBand({ height }: { height: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.band, { height: insets.top + height }]}>
      <Tiled source={textures.dirtDark} style={StyleSheet.absoluteFill} />
      <Tiled source={textures.dirtDarkEdge} style={styles.bandEdge} />
    </View>
  );
}

/** Grass block ground for the bottom of the screen, with blades poking up. */
export function GrassGround({ height }: { height: number }) {
  return (
    <View pointerEvents="none" style={[styles.ground, { height }]}>
      <Tiled source={textures.grassEdge} style={styles.groundEdge} />
      <Tiled source={textures.grass} style={StyleSheet.absoluteFill} />
    </View>
  );
}

export function BlockIcon({ size }: { size: number }) {
  return <Image source={textures.block} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />;
}

export function Wordmark({ height = 26 }: { height?: number }) {
  return (
    <Image
      source={textures.wordmark}
      accessible
      accessibilityRole="image"
      accessibilityLabel="NetherNet"
      style={{ height, width: height * WORDMARK_RATIO }}
    />
  );
}

export function BrandMark({ height = 26 }: { height?: number }) {
  return (
    <View style={styles.brand}>
      <BlockIcon size={height + 4} />
      <Wordmark height={height} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  band: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  bandEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -EDGE_HEIGHT + 4,
    height: EDGE_HEIGHT,
  },
  ground: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  groundEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -EDGE_HEIGHT + 4,
    height: EDGE_HEIGHT,
    transform: [{ scaleY: -1 }],
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
