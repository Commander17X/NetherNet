import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { EmptyState, SectionTitle } from "@/components/EmptyState";
import { GlassPanel } from "@/components/hud/GlassPanel";
import { PingGraph } from "@/components/hud/PingGraph";
import { PixelLabel } from "@/components/hud/PixelLabel";
import { VitalsPanel } from "@/components/hud/StatRows";
import { starSprite } from "@/components/hud/sprites";
import { MotdText } from "@/components/MotdText";
import { Screen } from "@/components/Screen";
import { displayAddress } from "@/components/ServerCard";
import { ServerIcon, useServerFavicon } from "@/components/ServerIcon";
import { EditionChip, editionName, PlayerMeter, StatusChip } from "@/components/ServerMeta";
import { CardSkeleton, HeroSkeleton } from "@/components/Skeleton";
import { RoundButton, TopBar } from "@/components/TopBar";
import { findServer } from "@/lib/findServer";
import { tap } from "@/lib/haptics";
import { formatCount } from "@/lib/lobby";
import { loadPings, recordPing } from "@/lib/pingHistory";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { removeSavedServer, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";

const LIVE_PING_MS = 10_000;

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

function confirmRemove(name: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`Remove ${name}?`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert("Remove server?", `${name} will be removed from this device.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: onConfirm },
  ]);
}

export default function ServerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = readId(params.id);
  const [server, setServer] = useState<ServerEntry | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [pings, setPings] = useState<number[]>([]);
  const [missing, setMissing] = useState(false);
  const [copied, setCopied] = useState(false);
  const icon = useServerFavicon(server?.id ?? "", status?.favicon, status?.online);

  useEffect(() => {
    let cancelled = false;
    void findServer(id).then(async (found) => {
      if (cancelled) {
        return;
      }
      if (!found) {
        setMissing(true);
        return;
      }
      setServer(found);
      setPings(await loadPings(found.id));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const refresh = useCallback(async (target: ServerEntry, cancelled: () => boolean) => {
    const lookedUp = await lookupStatus({ host: target.host, port: target.port, edition: target.edition, fresh: true });
    if (cancelled()) {
      return;
    }
    setStatus(lookedUp);
    if (lookedUp.online) {
      setPings(await recordPing(target.id, lookedUp.pingMs));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!server) {
        return;
      }
      let stopped = false;
      const isStopped = () => stopped;
      void refresh(server, isStopped);
      const timer = setInterval(() => void refresh(server, isStopped), LIVE_PING_MS);
      return () => {
        stopped = true;
        clearInterval(timer);
      };
    }, [refresh, server]),
  );

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  if (missing) {
    return (
      <Screen bottomInset>
        <View style={styles.page}>
          <TopBar onBack={goBack} />
          <View style={styles.missing}>
            <EmptyState
              sprite={starSprite}
              title="Server not found"
              body="It may have been removed, or this link is out of date."
              action={{ label: "Back to the lobby", onPress: () => router.replace("/") }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (!server) {
    return (
      <Screen bottomInset>
        <View style={[styles.page, styles.content]}>
          <TopBar onBack={goBack} />
          <HeroSkeleton />
          <CardSkeleton />
        </View>
      </Screen>
    );
  }

  const current = server;
  const offline = Boolean(status && !status.online);
  const edition = current.edition === "auto" ? (status?.edition ?? "auto") : current.edition;
  const address = displayAddress(current, status);
  const origin = current.source === "featured" ? "Featured" : current.source === "public" ? "Popular" : "Added by you";

  async function copyAddress() {
    await Clipboard.setStringAsync(address);
    tap("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const tiles: { label: string; value: string }[] = [
    {
      label: "Players",
      value: status?.online && status.playersOnline != null ? formatCount(status.playersOnline) : "--",
    },
    { label: "Version", value: status?.version ?? "--" },
    { label: "Edition", value: editionName(edition) },
    { label: status?.gameMode ? "Mode" : "Listed", value: status?.gameMode ?? origin },
  ];

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={[styles.page, styles.content]}>
        <TopBar
          onBack={goBack}
          trailing={
            <RoundButton
              icon={current.favorite ? "star" : "star-outline"}
              color={current.favorite ? colors.accent : colors.text}
              label={current.favorite ? "Remove from favorites" : "Add to favorites"}
              onPress={() => {
                void toggleFavoriteId(current.id).then((favorite) => setServer({ ...current, favorite }));
              }}
            />
          }
        />

        <View style={styles.identity}>
          <ServerIcon name={current.name} uri={icon} size={96} />
          <View style={styles.identityCopy}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.name}>
              {current.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Address ${address}. Copy`}
              onPress={() => void copyAddress()}
              style={styles.addressRow}
            >
              <Text style={styles.address} numberOfLines={1}>
                {address}
              </Text>
              <Text style={[styles.copy, copied && { color: colors.online }]}>{copied ? "Copied" : "Copy"}</Text>
            </Pressable>
            <View style={styles.chips}>
              <StatusChip status={status} />
              <EditionChip edition={edition} />
            </View>
          </View>
        </View>

        <View style={styles.sign}>
          <PixelLabel size={7} color={colors.tertiary} style={styles.signLabel}>
            MESSAGE OF THE DAY
          </PixelLabel>
          {status ? (
            <MotdText lines={status.motd} dim={offline} linesToShow={3} size={18} centered />
          ) : (
            <Text style={styles.waiting}>Reaching the server...</Text>
          )}
        </View>

        <AppButton
          label="Join server"
          icon="play"
          onPress={() => router.push(`/join/${encodeURIComponent(current.id)}`)}
        />

        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <GlassPanel key={tile.label} round={radius.md} style={styles.tile}>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {tile.value}
              </Text>
            </GlassPanel>
          ))}
        </View>

        <SectionTitle>Status</SectionTitle>
        <GlassPanel style={styles.panel}>
          <PlayerMeter status={status} height={10} />
          <VitalsPanel
            ping={status?.online ? status.pingMs : null}
            online={status?.online ? status.playersOnline : null}
            max={status?.online ? status.playersMax : null}
          />
        </GlassPanel>

        <SectionTitle trailing={<Text style={styles.liveText}>Every 10s</Text>}>Ping</SectionTitle>
        <GlassPanel style={styles.panel}>
          <PingGraph pings={pings} />
          {status?.unreachable && status.error ? <Text style={styles.error}>{status.error}</Text> : null}
        </GlassPanel>

        {current.description ? (
          <>
            <SectionTitle>About</SectionTitle>
            <Text style={styles.description}>{current.description}</Text>
          </>
        ) : null}

        {current.source === "saved" ? (
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton
                label="Edit"
                icon="create-outline"
                variant="secondary"
                onPress={() => router.push(`/edit/${encodeURIComponent(current.id)}`)}
              />
            </View>
            <View style={styles.action}>
              <AppButton
                label="Remove"
                icon="trash-outline"
                variant="danger"
                onPress={() => confirmRemove(current.name, () => void removeSavedServer(current.id).then(goBack))}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: space.md,
  },
  content: {
    paddingBottom: space.xxl,
    gap: space.lg,
  },
  missing: {
    flex: 1,
    justifyContent: "center",
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
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 28,
  },
  address: {
    flexShrink: 1,
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "500",
  },
  copy: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sign: {
    gap: space.sm + space.xs,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    minHeight: 112,
    justifyContent: "center",
  },
  signLabel: {
    textAlign: "center",
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 16,
    textAlign: "center",
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    paddingVertical: space.sm + space.xs,
    paddingHorizontal: space.md,
    gap: space.xs,
  },
  tileLabel: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "700",
  },
  tileValue: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  panel: {
    padding: space.md,
    gap: space.md,
  },
  liveText: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  error: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  description: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
});
