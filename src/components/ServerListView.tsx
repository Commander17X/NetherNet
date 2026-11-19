import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { buildCatalog, groupServers } from "@/lib/catalog";
import { friendlyError } from "@/lib/errors";
import { FEATURED_SERVER } from "@/lib/featured";
import { feedForChange, pushFeed, summarizeLobby, type FeedItem } from "@/lib/lobby";
import { recordPing } from "@/lib/pingHistory";
import { RelayClient } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadServerFile, loadSettings, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { EmptyState, SectionTitle } from "./EmptyState";
import { HeroBanner } from "./HeroBanner";
import { ChatFeed } from "./hud/ChatFeed";
import { PixelLabel } from "./hud/PixelLabel";
import { PixelSprite } from "./hud/PixelSprite";
import { Scoreboard } from "./hud/Scoreboard";
import { plusSprite, starSprite } from "./hud/sprites";
import { PageHeader } from "./Screen";
import { ServerCard } from "./ServerCard";
import { CardSkeleton, HeroSkeleton } from "./Skeleton";
import { useTabContentInset } from "./TabBar";

const REFRESH_MS = 30_000;
const WIDE_LAYOUT = 900;

export function ServerListView({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const router = useRouter();
  const tabInset = useTabContentInset();
  const { width } = useWindowDimensions();
  const wide = !favoritesOnly && width >= WIDE_LAYOUT;
  const [entries, setEntries] = useState<ServerEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ServerStatus | undefined>>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const lastSeen = useRef<Record<string, ServerStatus | undefined>>({});

  const pingAll = useCallback(async (catalog: ServerEntry[], fresh: boolean) => {
    await Promise.all(
      catalog.map(async (server) => {
        const status = await lookupStatus({ host: server.host, port: server.port, edition: server.edition, fresh });
        const before = lastSeen.current[server.id];
        lastSeen.current[server.id] = status;
        setStatuses((current) => ({ ...current, [server.id]: status }));
        if (status.online && status.checkedAt !== before?.checkedAt) {
          void recordPing(server.id, status.pingMs);
        }
        const item = feedForChange(server, before, status);
        if (item) {
          setFeed((current) => pushFeed(current, item));
        }
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
          setNote(friendlyError(error, "The relay didn't answer, so popular servers are hidden."));
        }
      } else {
        setNote(null);
      }
      const catalog = buildCatalog({ saved: file.servers, favoriteIds: file.favoriteIds, publicServers });
      setEntries(catalog);
      setLoaded(true);
      await pingAll(catalog, fresh);
    },
    [pingAll],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
      const timer = setInterval(() => void load(true), REFRESH_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const groups = groupServers(entries, favoritesOnly);
  const stats = summarizeLobby(entries, statuses);
  const favoriteCount = entries.filter((server) => server.favorite).length;

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
    groups.favorites.length > 0 ? { title: favoritesOnly ? "Starred" : "Favorites", servers: groups.favorites } : null,
    !favoritesOnly && groups.saved.length > 0 ? { title: "Your servers", servers: groups.saved } : null,
    !favoritesOnly && groups.publicServers.length > 0 ? { title: "Popular", servers: groups.publicServers } : null,
  ].filter((section): section is { title: string; servers: ServerEntry[] } => section !== null);

  const empty = favoritesOnly && loaded && sections.length === 0 && !groups.featured;

  const header = favoritesOnly ? (
    <PageHeader title="Favorites" subtitle="Your starred servers, ready to join." />
  ) : (
    <PageHeader
      title="Lobby"
      subtitle="Java and Bedrock servers, live."
      accessory={
        <View style={styles.live} accessible accessibilityLabel="Live, refreshes every 30 seconds">
          <View style={styles.liveDot} />
          <PixelLabel size={7} color={colors.online}>
            LIVE
          </PixelLabel>
        </View>
      }
    />
  );

  const hud = favoritesOnly ? null : (
    <View style={styles.hud}>
      <ChatFeed items={feed} waiting={stats.checkedCount === 0} />
      <Scoreboard stats={stats} favorites={favoriteCount} footer={FEATURED_SERVER.host} />
    </View>
  );

  const list = (
    <View style={[styles.column, empty && styles.columnFill]}>
      {!loaded ? (
        <>
          {favoritesOnly ? null : <HeroSkeleton />}
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : (
        <>
          {groups.featured ? (
            <HeroBanner
              server={groups.featured}
              status={statuses[groups.featured.id]}
              onOpen={() => openServer(groups.featured!)}
              onJoin={() => joinServer(groups.featured!)}
            />
          ) : null}

          {!wide ? hud : null}

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <SectionTitle trailing={<Text style={styles.sectionCount}>{section.servers.length}</Text>}>
                {section.title}
              </SectionTitle>
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
          ))}

          {!favoritesOnly && groups.saved.length === 0 ? (
            <View style={styles.section}>
              <SectionTitle>Your servers</SectionTitle>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add your first server"
                accessibilityHint="Opens the add server screen"
                onPress={() => router.push("/add")}
                style={({ pressed }) => [styles.emptySlot, pressed && styles.emptySlotPressed]}
              >
                <View style={styles.emptyIcon}>
                  <PixelSprite sprite={plusSprite} pixel={3} />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={styles.emptyTitle}>Add your first server</Text>
                  <Text style={styles.emptyBody}>
                    Any Java or Bedrock address. Custom ports and plain domains work too.
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}

          {empty ? (
            <View style={styles.emptyCenter}>
              <EmptyState
                sprite={starSprite}
                title="No favorites yet"
                body="Tap the star on any server and it will wait for you here."
                action={{ label: "Browse the lobby", onPress: () => router.navigate("/") }}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scroll,
        wide && styles.scrollWide,
        { paddingBottom: tabInset },
        empty && styles.scrollFill,
      ]}
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
      {header}

      {note ? (
        <View accessibilityLiveRegion="polite" style={styles.note}>
          <Text style={styles.noteText}>{note}</Text>
        </View>
      ) : null}

      {wide ? (
        <View style={styles.wideRow}>
          <View style={styles.wideMain}>{list}</View>
          <View style={styles.wideSide}>{hud}</View>
        </View>
      ) : (
        list
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: space.md,
    gap: space.lg,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  scrollWide: {
    maxWidth: 1080,
    paddingHorizontal: space.xl,
  },
  scrollFill: {
    flexGrow: 1,
  },
  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + 2,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pixel,
    backgroundColor: "rgba(67,224,140,0.1)",
    borderWidth: 1,
    borderColor: "rgba(67,224,140,0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.online,
  },
  note: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(245,178,27,0.3)",
    padding: space.md,
  },
  noteText: {
    color: colors.accent,
    fontSize: 15,
    lineHeight: 20,
  },
  column: {
    gap: space.lg,
  },
  columnFill: {
    flex: 1,
  },
  emptyCenter: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: space.xxl,
  },
  hud: {
    gap: space.sm + space.xs,
  },
  section: {
    gap: space.sm + space.xs,
  },
  sectionCount: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  wideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.lg,
  },
  wideMain: {
    flex: 1,
  },
  wideSide: {
    width: 320,
  },
  emptySlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.strokeStrong,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  emptySlotPressed: {
    backgroundColor: colors.fill,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,240,58,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,240,58,0.25)",
  },
  emptyCopy: {
    flex: 1,
    gap: space.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  emptyBody: {
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 19,
  },
});
