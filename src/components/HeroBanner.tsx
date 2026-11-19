import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, fillParent, radius, space } from "@/theme";
import { AppButton } from "./AppButton";
import { PixelLabel } from "./hud/PixelLabel";
import { SignalBars } from "./hud/SignalBars";
import { MotdText } from "./MotdText";
import { displayAddress } from "./ServerCard";
import { EditionChip, PlayerMeter, StatusChip } from "./ServerMeta";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

const BLOCKS = [
  { right: 18, top: 18, size: 14, opacity: 0.22 },
  { right: 38, top: 32, size: 10, opacity: 0.14 },
  { right: 62, top: 14, size: 8, opacity: 0.1 },
  { right: 24, top: 60, size: 8, opacity: 0.12 },
  { right: 90, top: 40, size: 6, opacity: 0.08 },
];

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
  const icon = useServerFavicon(server.id, status?.favicon, status?.online);
  const offline = Boolean(status && !status.online);
  const edition = server.edition === "auto" && status ? status.edition : server.edition;

  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.shadow}>
      <View style={styles.card}>
        <LinearGradient
          pointerEvents="none"
          colors={["#3A2706", "#1A1309", "#0E1016"]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {BLOCKS.map((block, index) => (
          <View
            key={index}
            pointerEvents="none"
            style={[
              styles.block,
              { right: block.right, top: block.top, width: block.size, height: block.size, opacity: block.opacity },
            ]}
          />
        ))}
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
          <AppButton label={`Join ${server.name}`} icon="play" onPress={onJoin} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(245,178,27,0.32)",
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  block: {
    position: "absolute",
    backgroundColor: colors.accent,
  },
  bevel: {
    ...fillParent,
    borderRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,220,150,0.18)",
  },
  body: {
    padding: space.lg,
    paddingBottom: space.md,
    gap: space.md,
  },
  kicker: {
    alignSelf: "flex-start",
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pixel,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(245,178,27,0.3)",
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
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
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
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
});
