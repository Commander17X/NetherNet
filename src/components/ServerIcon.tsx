import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { cachedFavicon, rememberFavicon } from "@/lib/faviconCache";
import { colors, fillParent } from "@/theme";

const PALETTES = [
  { base: "#1E2A3D", ink: "#5AA9FF" },
  { base: "#2D2213", ink: "#F5B21B" },
  { base: "#14291F", ink: "#43E08C" },
  { base: "#2B1A2C", ink: "#E07BFF" },
  { base: "#2C1A1A", ink: "#FF6B74" },
  { base: "#152A2C", ink: "#55E6F0" },
];

function hashName(name: string): number {
  let hash = 2166136261;
  for (let index = 0; index < name.length; index += 1) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function blockPattern(name: string): boolean[] {
  const hash = hashName(name.trim().toLowerCase() || "?");
  const cells: boolean[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      const mirrored = column < 3 ? column : 4 - column;
      cells.push(((hash >> (row * 3 + mirrored)) & 1) === 1);
    }
  }
  return cells;
}

export function ServerIcon({ name, uri, size = 52 }: { name: string; uri?: string | null; size?: number }) {
  const round = Math.max(4, Math.round(size * 0.16));
  const frame = { width: size, height: size, borderRadius: round };

  if (uri) {
    return (
      <View style={[styles.frame, frame]}>
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={`${name} icon`}
        />
        <View pointerEvents="none" style={[styles.bevel, { borderRadius: round }]} />
      </View>
    );
  }

  const palette = PALETTES[hashName(name) % PALETTES.length] ?? PALETTES[0];
  const cells = blockPattern(name);
  const grid = Math.floor((size * 0.62) / 5);

  return (
    <View
      accessible
      accessibilityLabel={`${name} icon`}
      style={[styles.frame, frame, styles.center, { backgroundColor: palette.base }]}
    >
      <View style={{ width: grid * 5, height: grid * 5, flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((on, index) => (
          <View
            key={index}
            style={{
              width: grid,
              height: grid,
              backgroundColor: on ? palette.ink : "transparent",
              opacity: on ? 1 : 0,
            }}
          />
        ))}
      </View>
      <View pointerEvents="none" style={[styles.bevel, { borderRadius: round }]} />
    </View>
  );
}

export function useServerFavicon(
  id: string,
  raw: string | null | undefined,
  online: boolean | undefined,
): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await cachedFavicon(id);
      if (!cancelled && stored) {
        setUri(stored);
      }
      if (raw) {
        const saved = await rememberFavicon(id, raw);
        if (!cancelled) {
          setUri(saved);
        }
        return;
      }
      if (online) {
        await rememberFavicon(id, null);
        if (!cancelled) {
          setUri(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, online, raw]);

  return uri;
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.6)",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  bevel: {
    ...fillParent,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    borderLeftColor: "rgba(255,255,255,0.10)",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.35)",
    borderRightColor: "rgba(0,0,0,0.25)",
  },
});
