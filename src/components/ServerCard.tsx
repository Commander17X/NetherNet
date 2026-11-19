import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { MotdText } from "./MotdText";
import { ServerMeta } from "./ServerMeta";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

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
  const address = status ? `${status.connectHost}:${status.connectPort}` : server.port == null ? server.host : `${server.host}:${server.port}`;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(320)}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={server.name}
        accessibilityHint="Opens server details"
        style={styles.card}
      >
        <View style={styles.top}>
          <ServerIcon name={server.name} uri={icon} />
          <View style={styles.copy}>
            <Text style={styles.name} numberOfLines={1}>
              {server.name}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {address}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityLabel={server.favorite ? "Remove favorite" : "Favorite"}
            onPress={() => {
              tap("light");
              onFavorite();
            }}
          >
            <Ionicons name={server.favorite ? "star" : "star-outline"} size={22} color={server.favorite ? colors.accent : colors.tertiary} />
          </Pressable>
        </View>
        {status ? <MotdText lines={status.motd} dim={!status.online} linesToShow={2} /> : <Text style={styles.waiting}>Checking</Text>}
        <ServerMeta status={status} players />
        <Pressable
          onPress={() => {
            tap("medium");
            onJoin();
          }}
          style={styles.join}
          accessibilityRole="button"
          accessibilityLabel={`Join ${server.name}`}
        >
          <Text style={styles.joinLabel}>Join</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accentInk} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: space.md,
    gap: space.sm + 4,
  },
  top: {
    flexDirection: "row",
    gap: space.sm + 4,
    alignItems: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  address: {
    color: colors.secondary,
    fontSize: 13,
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 15,
  },
  join: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
  },
  joinLabel: {
    color: colors.accentInk,
    fontSize: 15,
    fontWeight: "700",
  },
});
