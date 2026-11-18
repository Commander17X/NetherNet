import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { buildCatalog, groupServers } from "@/lib/catalog";
import { RelayClient } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadServerFile, loadSettings, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";
import { HeartRow, HungerRow, SectionLabel } from "./HudBits";
import { PixelPanel } from "./PixelPanel";
import { Scoreboard } from "./Scoreboard";
import { ServerCard } from "./ServerCard";

export function ServerListView({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const pixel = usePixelFont();
  const body = useBodyFont();
  const [entries, setEntries] = useState<ServerEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ServerStatus | undefined>>({});
  const [refreshing, setRefreshing] = useState(false);
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
          setNote(error instanceof Error ? error.message : "Couldn't reach the relay.");
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
    groups.featured ? { title: "Featured", servers: [groups.featured] } : null,
    groups.favorites.length > 0 ? { title: "Favorites", servers: groups.favorites } : null,
    !favoritesOnly && groups.saved.length > 0 ? { title: "Your servers", servers: groups.saved } : null,
    !favoritesOnly && groups.publicServers.length > 0 ? { title: "Public", servers: groups.publicServers } : null,
  ].filter((section): section is { title: string; servers: ServerEntry[] } => section !== null);

  const list = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.gold}
          onRefresh={() => {
            setRefreshing(true);
            void load(true).finally(() => setRefreshing(false));
          }}
        />
      }
    >
      <View style={styles.hud}>
        <HeartRow />
        <HungerRow />
      </View>
      <Text style={[styles.wordmark, { fontFamily: pixel }]}>NETHERNET</Text>
      <Text style={[styles.tagline, { fontFamily: body }]}>Java and Bedrock, from your phone.</Text>

      {!wide ? (
        <View style={styles.board}>
          <Scoreboard servers={entries} statuses={statuses} />
        </View>
      ) : null}

      <PixelPanel>
        <Text style={[styles.chat, { fontFamily: body, color: note ? colors.yellow : colors.aqua }]}>
          {note ? `[!] ${note}` : "[!] Pull to refresh. Tap Join and Minecraft opens with the server added."}
        </Text>
      </PixelPanel>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <SectionLabel>{favoritesOnly ? "Favorites" : "Your servers"}</SectionLabel>
          <Text style={[styles.emptyText, { fontFamily: body }]}>
            {favoritesOnly ? "Star a server and it will stay in this hotbar slot." : "Add a server from the hotbar. Any host and port works."}
          </Text>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.title}>
          <SectionLabel>{section.title}</SectionLabel>
          <View style={styles.stack}>
            {section.servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                status={statuses[server.id]}
                featured={server.featured}
                onOpen={() => openServer(server)}
                onJoin={() => joinServer(server)}
                onFavorite={() => void favorite(server)}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (!wide) {
    return list;
  }

  return (
    <View style={styles.wide}>
      <View style={styles.wideList}>{list}</View>
      <View style={styles.wideBoard}>
        <Scoreboard servers={entries} statuses={statuses} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 8,
  },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  wordmark: {
    color: colors.gold,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    marginTop: 8,
  },
  tagline: {
    color: colors.muted,
    fontSize: 20,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 6,
  },
  board: {
    marginBottom: 4,
  },
  chat: {
    fontSize: 18,
    lineHeight: 22,
  },
  stack: {
    gap: 10,
  },
  empty: {
    marginTop: 8,
  },
  emptyText: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 24,
  },
  wide: {
    flex: 1,
    flexDirection: "row",
  },
  wideList: {
    flex: 1,
  },
  wideBoard: {
    width: 280,
    paddingTop: 16,
    paddingRight: 16,
  },
});
