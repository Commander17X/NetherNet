import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { GlassPanel } from "./hud/GlassPanel";
import { SignalBars } from "./hud/SignalBars";
import { MotdText } from "./MotdText";
import { EditionChip, PlayerMeter } from "./ServerMeta";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

export function displayAddress(server: ServerEntry, status?: ServerStatus | null): string {
  if (status) {
    const host = status.connectHost.includes(":") ? `[${status.connectHost}]` : status.connectHost;
    return `${host}:${status.connectPort}`;
  }
  return server.port == null ? server.host : `${server.host}:${server.port}`;
}

export function ServerCard({
  server,
  status,
  index = 0,
  onOpen,
  onJoin,
  onFavorite,
}: {
  server: ServerEntry;
  status?: ServerStatus;
  index?: number;
  onOpen: () => void;
  onJoin: () => void;
  onFavorite: () => void;
}) {
  const icon = useServerFavicon(server.id, status?.favicon, status?.online);
  const edition = server.edition === "auto" && status ? status.edition : server.edition;
  const offline = Boolean(status && !status.online);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).duration(340)}>
      <GlassPanel style={styles.card}>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${server.name}, ${offline ? "offline" : status ? "online" : "checking"}`}
          accessibilityHint="Opens server details"
          style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        >
          <ServerIcon name={server.name} uri={icon} size={56} />
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {server.name}
              </Text>
              <View style={styles.signal}>
                <SignalBars ping={status?.pingMs} offline={offline} />
                <Text style={styles.ping}>
                  {offline ? "off" : status?.pingMs != null ? `${status.pingMs}ms` : "..."}
                </Text>
              </View>
            </View>
            {status ? (
              <MotdText lines={status.motd} dim={offline} linesToShow={2} size={14} />
            ) : (
              <Text style={styles.waiting}>Pinging {displayAddress(server)}</Text>
            )}
          </View>
        </Pressable>
        <View style={styles.footer}>
          <EditionChip edition={edition} />
          <PlayerMeter status={status} height={7} />
          <Pressable
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              server.favorite ? `Remove ${server.name} from favorites` : `Add ${server.name} to favorites`
            }
            onPress={() => {
              tap("light");
              onFavorite();
            }}
            style={styles.star}
          >
            <Ionicons
              name={server.favorite ? "star" : "star-outline"}
              size={20}
              color={server.favorite ? colors.accent : colors.tertiary}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              tap("medium");
              onJoin();
            }}
            style={({ pressed }) => [styles.join, offline && styles.joinMuted, pressed && styles.joinPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Join ${server.name}`}
          >
            <Text style={[styles.joinLabel, offline && styles.joinLabelMuted]}>Join</Text>
          </Pressable>
        </View>
      </GlassPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.md,
    gap: space.md,
  },
  main: {
    flexDirection: "row",
    gap: space.sm + space.xs,
  },
  pressed: {
    opacity: 0.75,
  },
  copy: {
    flex: 1,
    gap: space.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  signal: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.xs + 2,
  },
  ping: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 38,
    textAlign: "right",
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 14,
    lineHeight: 19,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  star: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  join: {
    minHeight: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0,0,0,0.25)",
  },
  joinMuted: {
    backgroundColor: colors.fillStrong,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  joinPressed: {
    opacity: 0.8,
  },
  joinLabel: {
    color: colors.accentInk,
    fontSize: 15,
    fontWeight: "800",
  },
  joinLabelMuted: {
    color: colors.text,
  },
});
