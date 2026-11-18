import { StyleSheet, Text, View } from "react-native";

import type { ServerStatus } from "@/lib/statusService";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";
import { PixelPanel } from "./PixelPanel";

function today(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${now.getFullYear()}`;
}

function Row({ label, value, labelColor = colors.white }: { label: string; value: string; labelColor?: string }) {
  const font = useBodyFont();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: labelColor, fontFamily: font }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.value, { fontFamily: font }]}>{value}</Text>
    </View>
  );
}

export function Scoreboard({
  servers,
  statuses,
}: {
  servers: ServerEntry[];
  statuses: Record<string, ServerStatus | undefined>;
}) {
  const pixel = usePixelFont();
  const online = servers.filter((server) => statuses[server.id]?.online).length;
  const favorites = servers.filter((server) => server.favorite).length;
  const players = servers.reduce((sum, server) => sum + (statuses[server.id]?.playersOnline ?? 0), 0);

  return (
    <PixelPanel accent="#2A1408">
      <Text style={[styles.title, { fontFamily: pixel }]}>NETHERNET</Text>
      <Row label={today()} value="" labelColor={colors.gray} />
      <Row label="Servers" value={String(servers.length)} labelColor={colors.aqua} />
      <Row label="Online" value={String(online)} labelColor={colors.green} />
      <Row label="Favorites" value={String(favorites)} labelColor={colors.yellow} />
      <Row label="Players" value={String(players)} labelColor={colors.white} />
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.gold,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 18,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 22,
  },
  label: {
    fontSize: 18,
    lineHeight: 22,
    flex: 1,
  },
  value: {
    color: colors.red,
    fontSize: 18,
    lineHeight: 22,
    minWidth: 28,
    textAlign: "right",
  },
});
