import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { tap } from "@/lib/haptics";
import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, fillParent, radius, space } from "@/theme";
import { AppButton } from "./AppButton";
import { Tiled } from "./blocks/Blocks";
import { textures } from "./blocks/textures";
import { PixelLabel } from "./hud/PixelLabel";
import { SignalBars } from "./hud/SignalBars";
import { MotdText } from "./MotdText";
import { displayAddress } from "./ServerCard";
import { EditionChip, PlayerMeter, StatusChip } from "./ServerMeta";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

export function HeroBanner({
  server,
  status,
  onOpen,
  onJoin,
  onFavorite,
}: {
  server: ServerEntry;
  status?: ServerStatus;
  onOpen: () => void;
  onJoin: () => void;
  onFavorite?: () => void;
}) {
  const icon = useServerFavicon(server.id, status?.favicon, status?.online);
  const offline = Boolean(status && !status.online);
  const edition = server.edition === "auto" && status ? status.edition : server.edition;

  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.shadow}>
      <View style={styles.card}>
        <Tiled source={textures.dirtDark} style={StyleSheet.absoluteFill} />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(18,13,9,0.15)", "rgba(18,13,9,0.55)", "rgba(18,13,9,0.88)"]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Tiled source={textures.grassEdge} style={styles.grass} />
        <View pointerEvents="none" style={styles.bevel} />
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${server.name}, featured server`}
          accessibilityHint="Opens server details"
          style={styles.body}
        >
          <View style={styles.kicker}>
            <PixelLabel size={8} color={colors.accent} shadow>
              FEATURED SERVER
            </PixelLabel>
          </View>
          <View style={styles.identity}>
            <ServerIcon name={server.name} uri={icon} size={72} />
            <View style={styles.identityCopy}>
              <Text maxFontSizeMultiplier={1.3} style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
                {server.name}
              </Text>
              <Text style={styles.address} numberOfLines={1}>
                {displayAddress(server, status)}
              </Text>
              <View style={styles.chips}>
                <StatusChip status={status} />
                <EditionChip edition={edition} />
              </View>
            </View>
          </View>
          <View style={styles.motd}>
            {status ? (
              <MotdText lines={status.motd} dim={offline} linesToShow={2} size={16} centered />
            ) : (
              <Text style={styles.waiting}>Reaching the server...</Text>
            )}
          </View>
          <View style={styles.stats}>
            <PlayerMeter status={status} height={9} />
            <View style={styles.ping}>
              <SignalBars ping={status?.pingMs} offline={offline} />
              <Text style={styles.pingText}>{status?.pingMs != null && !offline ? `${status.pingMs}ms` : "--"}</Text>
            </View>
          </View>
          {server.description ? <Text style={styles.description}>{server.description}</Text> : null}
        </Pressable>
        <View style={styles.actions}>
          <View style={styles.join}>
            <AppButton label={`Join ${server.name}`} icon="play" onPress={onJoin} />
          </View>
          {onFavorite ? (
            <Pressable
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                server.favorite ? `Remove ${server.name} from favorites` : `Add ${server.name} to favorites`
              }
              accessibilityState={{ selected: server.favorite }}
              onPress={() => {
                tap("light");
                onFavorite();
              }}
              style={({ pressed }) => [styles.star, server.favorite && styles.starOn, pressed && styles.starPressed]}
            >
              <Ionicons
                name={server.favorite ? "star" : "star-outline"}
                size={22}
                color={server.favorite ? colors.warning : colors.text}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: radius.xl,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 3,
    borderColor: colors.edge,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  grass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  bevel: {
    ...fillParent,
    borderRadius: radius.xl,
    borderTopWidth: 2,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  body: {
    padding: space.lg,
    paddingTop: space.xl + space.sm,
    paddingBottom: space.md,
    gap: space.md,
  },
  kicker: {
    alignSelf: "flex-start",
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pixel,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 2,
    borderColor: colors.edge,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  identityCopy: {
    flex: 1,
    gap: space.xs,
  },
  name: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  address: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginTop: space.xs,
  },
  motd: {
    paddingVertical: space.sm + space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 2,
    borderColor: colors.edge,
    minHeight: 64,
    justifyContent: "center",
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 15,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  ping: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.xs + 2,
  },
  pingText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "right",
  },
  description: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  join: {
    flex: 1,
  },
  star: {
    width: 52,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.edge,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  starOn: {
    backgroundColor: "rgba(245,178,27,0.16)",
    borderColor: "rgba(245,178,27,0.55)",
  },
  starPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
