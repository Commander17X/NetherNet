import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ServerStatus } from "@/lib/types";
import { GlassPanel } from "@/components/GlassPanel";
import { StatusPill } from "@/components/StatusPill";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export type ServerListItem = {
  id: string;
  name: string;
  address: string;
  featured?: boolean;
  href: string;
  status?: ServerStatus;
  statusLoading?: boolean;
};

type Props = {
  item: ServerListItem;
};

export function ServerCard({ item }: Props) {
  return (
    <Link href={item.href as never} asChild>
      <Pressable>
        <GlassPanel style={item.featured ? styles.featured : undefined}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            {item.featured ? <Text style={styles.badge}>FEATURED</Text> : null}
          </View>
          <Text style={styles.address}>{item.address}</Text>
          <View style={styles.footer}>
            <StatusPill
              online={item.status?.online}
              loading={item.statusLoading}
              players={item.status?.players}
            />
            <Text style={styles.chevron}>{">"}</Text>
          </View>
        </GlassPanel>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  featured: {
    borderColor: tubnetColors.featured,
    backgroundColor: "rgba(157, 124, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tubnetSpacing.sm,
    marginBottom: tubnetSpacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: tubnetFonts.display,
    fontSize: 10,
    color: tubnetColors.text,
    lineHeight: 14,
  },
  badge: {
    fontFamily: tubnetFonts.display,
    fontSize: 7,
    color: tubnetColors.featured,
  },
  address: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
    marginBottom: tubnetSpacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevron: {
    fontFamily: tubnetFonts.display,
    fontSize: 10,
    color: tubnetColors.accent,
  },
});