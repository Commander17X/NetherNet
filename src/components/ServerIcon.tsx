import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { cachedFavicon, rememberFavicon } from "@/lib/faviconCache";
import { colors } from "@/theme";

const TILES = ["#3C4A63", "#4A3C32", "#2F4A44", "#4A3548", "#3A4060", "#4E4630"];

function tileColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index) * (index + 1)) % TILES.length;
  }
  return TILES[hash] ?? TILES[0];
}

export function ServerIcon({
  name,
  uri,
  size = 52,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  const letter = (name.trim().slice(0, 1) || "?").toUpperCase();
  const radiusSize = Math.round(size * 0.28);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radiusSize, backgroundColor: colors.fill }}
        contentFit="cover"
        accessibilityLabel={`${name} icon`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radiusSize, backgroundColor: tileColor(name) },
      ]}
    >
      <View style={[styles.pixel, { backgroundColor: "rgba(255,255,255,0.14)" }]} />
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.38) }]}>{letter}</Text>
    </View>
  );
}

export function useServerFavicon(id: string, raw: string | null | undefined, online: boolean | undefined): string | null {
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
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pixel: {
    position: "absolute",
    width: "42%",
    height: "42%",
    left: 0,
    top: 0,
  },
  letter: {
    color: colors.text,
    fontWeight: "700",
  },
});
