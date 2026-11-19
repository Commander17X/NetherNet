import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { buildCatalog, groupServers } from "@/lib/catalog";
import { RelayClient } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadServerFile, loadSettings, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, space, usePixelFont } from "@/theme";
import { CardSkeleton } from "./Skeleton";
import { EmptyState, SectionTitle } from "./EmptyState";
import { HeroBanner } from "./HeroBanner";
import { ServerCard } from "./ServerCard";

export function ServerListView({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const router = useRouter();
  const pixel = usePixelFont();
  const [entries, setEntries] = useState<ServerEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ServerStatus | undefined>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const pingAll = useCallback(async (catalog: ServerEntry[], fresh: boolean) => {
    await Promise.all(
      catalog.map(async (server) => {
        const status = await lookupStatus({
          host: server.host,
          port: server.port,
          edition: server.edition,
          fresh,
        });
        setStatuses((current) => ({ ...current, [server.id]: status }));
      }),
    );
  }, []);

  const load = useCallback(
    async (fresh: boolean) => {
      const [file, settings] = await Promise.all([loadServerFile(), loadSettings()]);
      let publicServers: Awaited<ReturnType<RelayClient["listPublicServers"]>> = [];
      if (settings.relayUrl) {
        try {
          publicServers = await new RelayClient(settings.relayUrl, settings.relayToken).listPublicServers();
          setNote(null);
        } catch (error) {
          setNote(error instanceof Error ? error.message : "Could not reach the relay.");
        }
      } else {
        setNote(null);
      }
      const catalog = buildCatalog({
        saved: file.servers,
        favoriteIds: file.favoriteIds,
        publicServers,
      });
      setEntries(catalog);
      setLoaded(true);
      await pingAll(catalog, fresh);
    },
    [pingAll],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const groups = groupServers(entries, favoritesOnly);

  function openServer(server: ServerEntry) {
    router.push(`/server/${encodeURIComponent(server.id)}`);
  }

  function joinServer(server: ServerEntry) {
    router.push(`/join/${encodeURIComponent(server.id)}`);
  }

  async function favorite(server: ServerEntry) {
    await toggleFavoriteId(server.id);
    await load(false);
  }

  const sections = [
    groups.favorites.length > 0 ? { title: "Favorites", servers: groups.favorites } : null,
    !favoritesOnly && groups.saved.length > 0 ? { title: "Your servers", servers: groups.saved } : null,
    !favoritesOnly && groups.publicServers.length > 0 ? { title: "Public", servers: groups.publicServers } : null,
  ].filter((section): section is { title: string; servers: ServerEntry[] } => section !== null);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={() => {
            setRefreshing(true);
            void load(true).finally(() => setRefreshing(false));
          }}
        />
      }
    >
      <View style={styles.header}>
        <Text maxFontSizeMultiplier={1.2} style={[styles.logo, { fontFamily: pixel }]}>
          NETHERNET
        </Text>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.title}>{favoritesOnly ? "Favorites" : "Servers"}</Text>
        <Text style={styles.subtitle}>Java and Bedrock, from your phone.</Text>
      </View>

      {note ? (
        <View accessibilityLiveRegion="polite" style={styles.note}>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}

      {!loaded ? (
        <View style={styles.stack}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <>
          {!favoritesOnly && groups.featured ? (
            <HeroBanner
              server={groups.featured}
              status={statuses[groups.featured.id]}
              onOpen={() => openServer(groups.featured!)}
              onJoin={() => joinServer(groups.featured!)}
            />
          ) : null}
          {favoritesOnly && groups.featured ? (
            <HeroBanner
              server={groups.featured}
              status={statuses[groups.featured.id]}
              onOpen={() => openServer(groups.featured!)}
              onJoin={() => joinServer(groups.featured!)}
            />
          ) : null}

          {sections.length === 0 && favoritesOnly && !groups.featured ? (
            <EmptyState
              icon="star-outline"
              title="No favorites yet"
              body="Star a server and it stays at the top of this list."
            />
          ) : null}
          {sections.length === 0 && !favoritesOnly && !groups.featured ? (
            <EmptyState
              icon="add-circle-outline"
              title="No servers yet"
              body="Add a hostname, a port, or an IPv6 address."
              action={{ label: "Add a server", onPress: () => router.push("/add") }}
            />
          ) : null}

          {sections.map((section) => (
            <View key={section.title}>
              <SectionTitle>{section.title}</SectionTitle>
              <View style={styles.stack}>
                {section.servers.map((server, index) => (
                  <ServerCard
                    key={server.id}
                    server={server}
                    status={statuses[server.id]}
                    index={index}
                    onOpen={() => openServer(server)}
                    onJoin={() => joinServer(server)}
                    onFavorite={() => void favorite(server)}
                  />
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
    gap: space.md,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    paddingTop: space.sm,
    gap: 4,
  },
  logo: {
    color: colors.accent,
    fontSize: 10,
    lineHeight: 16,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 22,
  },
  note: {
    backgroundColor: "rgba(232,163,23,0.12)",
    borderRadius: 14,
    padding: space.md,
  },
  noteText: {
    color: colors.accent,
    fontSize: 15,
    lineHeight: 20,
  },
  stack: {
    gap: space.sm + 4,
  },
});
