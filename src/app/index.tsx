import { Link, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ServerCard } from "@/components/ServerCard";
import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { FEATURED_TRIX, featuredAsAddress } from "@/data/featured";
import { useServerStatus } from "@/hooks/useServerStatus";
import { useServers } from "@/hooks/useServers";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export default function ServerListScreen() {
  const { servers, loading, reload } = useServers();
  const trixStatus = useServerStatus(FEATURED_TRIX.javaHost, "java");

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const items = useMemo(() => {
    const featured = {
      id: FEATURED_TRIX.id,
      name: FEATURED_TRIX.name,
      address: featuredAsAddress("java"),
      featured: true,
      href: `/server/${FEATURED_TRIX.id}`,
      status: trixStatus.status,
      statusLoading: trixStatus.loading,
    };
  return [
      featured,
      ...servers.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        featured: false,
        href: `/server/${s.id}`,
      })),
    ];
  }, [servers, trixStatus.loading, trixStatus.status]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.toolbar}>
          <Text style={styles.brand}>NETHERNET</Text>
          <Link href="/settings" asChild>
            <PixelButton label="SET" variant="ghost" small />
          </Link>
        </View>
        <Text style={styles.sub}>Relay-ready server list</Text>
        {loading ? (
          <ActivityIndicator color={tubnetColors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <ServerCard item={item} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No saved servers yet — add one below.</Text>
            }
          />
        )}
        <View style={styles.actions}>
          <Link href="/server/add" asChild>
            <PixelButton label="ADD SERVER" />
          </Link>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: tubnetSpacing.md,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tubnetSpacing.sm,
  },
  brand: {
    fontFamily: tubnetFonts.display,
    fontSize: 12,
    color: tubnetColors.accent,
  },
  sub: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
    marginBottom: tubnetSpacing.md,
  },
  list: {
    gap: tubnetSpacing.md,
    paddingBottom: tubnetSpacing.lg,
  },
  loader: {
    marginTop: tubnetSpacing.xl,
  },
  empty: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
    textAlign: "center",
    marginTop: tubnetSpacing.lg,
  },
  actions: {
    paddingVertical: tubnetSpacing.md,
  },
});