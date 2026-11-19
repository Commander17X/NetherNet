import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space, usePixelFont } from "@/theme";
import { AppButton } from "./AppButton";
import { MotdText } from "./MotdText";
import { ServerMeta } from "./ServerMeta";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

function addressOf(server: ServerEntry, status?: ServerStatus): string {
  if (status) {
    return `${status.connectHost}:${status.connectPort}`;
  }
  return server.port == null ? server.host : `${server.host}:${server.port}`;
}

export function HeroBanner({
  server,
  status,
  onOpen,
  onJoin,
}: {
  server: ServerEntry;
  status?: ServerStatus;
  onOpen: () => void;
  onJoin: () => void;
}) {
  const pixel = usePixelFont();
  const icon = useServerFavicon(server.id, status?.favicon, status?.online);

  return (
    <Animated.View entering={FadeInDown.duration(360)}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${server.name}, featured server`}
        accessibilityHint="Opens server details"
        style={styles.card}
      >
        <View style={styles.rule} pointerEvents="none" />
        <Text maxFontSizeMultiplier={1.2} style={[styles.kicker, { fontFamily: pixel }]}>
          FEATURED
        </Text>
        <View style={styles.top}>
          <ServerIcon name={server.name} uri={icon} size={72} />
          <View style={styles.copy}>
            <Text style={styles.name}>{server.name}</Text>
            <Text style={styles.address} numberOfLines={1}>
              {addressOf(server, status)}
            </Text>
          </View>
        </View>
        <View style={styles.motd}>
          {status ? <MotdText lines={status.motd} dim={!status.online} linesToShow={2} /> : <Text style={styles.waiting}>Checking the server</Text>}
        </View>
        <ServerMeta status={status} players />
        {server.description ? <Text style={styles.description}>{server.description}</Text> : null}
        <View style={styles.join}>
          <AppButton label="Join" onPress={onJoin} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(232,163,23,0.35)",
    padding: space.lg,
    gap: space.md,
    overflow: "hidden",
  },
  rule: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.accent,
  },
  kicker: {
    color: colors.accent,
    fontSize: 9,
    lineHeight: 14,
  },
  top: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  address: {
    color: colors.secondary,
    fontSize: 15,
  },
  motd: {
    minHeight: 20,
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 15,
  },
  description: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  join: {
    marginTop: space.xs,
  },
});
