import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";
import { MotdText } from "./MotdText";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

function pingColor(ping: number | null): string {
  if (ping == null) {
    return colors.gray;
  }
  if (ping < 120) {
    return colors.green;
  }
  if (ping < 280) {
    return colors.yellow;
  }
  return colors.red;
}

function editionLabel(server: ServerEntry, status?: ServerStatus): string {
  const edition = server.edition === "auto" ? status?.edition ?? "auto" : server.edition;
  if (edition === "java") {
    return "JAVA";
  }
  if (edition === "bedrock") {
    return "BEDROCK";
  }
  return "AUTO";
}

export function ServerCard({
  server,
  status,
  featured = false,
  onOpen,
  onJoin,
  onFavorite,
}: {
  server: ServerEntry;
  status?: ServerStatus;
  featured?: boolean;
  onOpen: () => void;
  onJoin: () => void;
  onFavorite: () => void;
}) {
  const pixel = usePixelFont();
  const body = useBodyFont();
  const players =
    status && !status.unreachable && status.playersOnline != null
      ? `${status.playersOnline}/${status.playersMax ?? "?"}`
      : status?.unreachable
        ? "—"
        : "...";
  const address = status ? `${status.connectHost}:${status.connectPort}` : server.port ? `${server.host}:${server.port}` : server.host;

  return (
    <PixelPanel accent={featured ? colors.gold : colors.black}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={server.name}>
        <View style={styles.top}>
          {status?.favicon ? (
            <Image source={{ uri: status.favicon }} style={styles.icon} />
          ) : (
            <View style={styles.iconFallback}>
              <Text style={[styles.iconLetter, { fontFamily: pixel }]}>{server.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { fontFamily: pixel }]} numberOfLines={2}>
                {server.name}
              </Text>
              <Pressable onPress={onFavorite} hitSlop={8} accessibilityLabel={server.favorite ? "Unfavorite" : "Favorite"}>
                <Text style={[styles.star, { color: server.favorite ? colors.yellow : colors.dark }]}>★</Text>
              </Pressable>
            </View>
            {featured ? <Text style={[styles.tag, { fontFamily: pixel }]}>FEATURED</Text> : null}
            <Text style={[styles.address, { fontFamily: body }]} numberOfLines={1}>
              {address}
            </Text>
          </View>
        </View>
        <View style={styles.motd}>
          {status ? (
            <MotdText lines={status.motd} dim={!status.online} />
          ) : (
            <Text style={[styles.waiting, { fontFamily: body }]}>Pinging…</Text>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.badge, { fontFamily: pixel, color: editionLabel(server, status) === "BEDROCK" ? colors.aqua : colors.gold }]}>
            {editionLabel(server, status)}
          </Text>
          <Text style={[styles.metaText, { fontFamily: body, color: status?.online ? colors.green : colors.red }]}>
            {status ? (status.online ? players : status.unreachable ? "No response" : "Offline") : "…"}
          </Text>
          <Text style={[styles.metaText, { fontFamily: body }]} numberOfLines={1}>
            {status?.version ?? ""}
          </Text>
          <Text style={[styles.metaText, { fontFamily: body, color: pingColor(status?.pingMs ?? null) }]}>
            {status?.pingMs != null ? `${status.pingMs} ms` : ""}
          </Text>
        </View>
      </Pressable>
      <View style={styles.join}>
        <PixelButton label="Join" tone="green" onPress={onJoin} />
      </View>
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    gap: 10,
  },
  icon: {
    width: 52,
    height: 52,
    backgroundColor: colors.slot,
  },
  iconFallback: {
    width: 52,
    height: 52,
    backgroundColor: "#24304A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.dark,
  },
  iconLetter: {
    color: colors.gold,
    fontSize: 16,
    lineHeight: 22,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  name: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  star: {
    fontSize: 22,
    lineHeight: 24,
  },
  tag: {
    color: colors.gold,
    fontSize: 8,
    lineHeight: 12,
  },
  address: {
    color: colors.aqua,
    fontSize: 18,
    lineHeight: 20,
  },
  motd: {
    marginTop: 8,
    minHeight: 24,
  },
  waiting: {
    color: colors.gray,
    fontSize: 18,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginTop: 8,
  },
  badge: {
    fontSize: 8,
    lineHeight: 12,
  },
  metaText: {
    color: colors.gray,
    fontSize: 18,
    lineHeight: 20,
  },
  join: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
});
