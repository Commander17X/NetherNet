import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { MotdText } from "@/components/MotdText";
import { PixelButton } from "@/components/PixelButton";
import { PixelPanel } from "@/components/PixelPanel";
import { Screen } from "@/components/Screen";
import { findServer } from "@/lib/findServer";
import { formatAddress } from "@/lib/address";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { removeSavedServer, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function ServerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pixel = usePixelFont();
  const body = useBodyFont();
  const [server, setServer] = useState<ServerEntry | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const id = readId(params.id);
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
      const lookedUp = await lookupStatus({
        host: found.host,
        port: found.port,
        edition: found.edition,
        fresh: true,
      });
      if (!cancelled) {
        setStatus(lookedUp);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (missing) {
    return (
      <Screen bottomInset>
        <View style={styles.content}>
          <Text style={[styles.title, { fontFamily: pixel }]}>Missing server</Text>
          <PixelButton label="Back" tone="stone" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!server) {
    return (
      <Screen bottomInset>
        <View style={styles.content}>
          <Text style={[styles.waiting, { fontFamily: body }]}>Loading…</Text>
        </View>
      </Screen>
    );
  }

  const typedAddress = server.port == null ? server.host : formatAddress(server.host, server.port);
  const liveAddress = status ? `${status.connectHost}:${status.connectPort}` : typedAddress;

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontFamily: pixel }]}>{server.name}</Text>
        <PixelPanel accent={server.featured ? colors.gold : colors.black}>
          <Text style={[styles.address, { fontFamily: body }]}>{liveAddress}</Text>
          <Text style={[styles.meta, { fontFamily: body }]}>
            {`${server.edition === "auto" ? status?.edition ?? "auto" : server.edition} · saved as ${typedAddress}`}
          </Text>
          {status ? <MotdText lines={status.motd} dim={!status.online} /> : <Text style={[styles.meta, { fontFamily: body }]}>Pinging…</Text>}
          <Text style={[styles.meta, { fontFamily: body, color: status?.online ? colors.green : colors.red }]}>
            {status
              ? status.online
                ? `${status.playersOnline ?? 0}/${status.playersMax ?? "?"} online`
                : status.unreachable
                  ? status.error ?? "No response"
                  : "Offline"
              : "Pinging…"}
          </Text>
          {status?.version ? <Text style={[styles.meta, { fontFamily: body }]}>{status.version}</Text> : null}
          {status?.gameMode ? <Text style={[styles.meta, { fontFamily: body }]}>{status.gameMode}</Text> : null}
          {status?.pingMs != null ? <Text style={[styles.meta, { fontFamily: body }]}>{`${status.pingMs} ms`}</Text> : null}
          {server.description ? <Text style={[styles.meta, { fontFamily: body }]}>{server.description}</Text> : null}
        </PixelPanel>
        <View style={styles.actions}>
          <PixelButton label="Join" tone="green" onPress={() => router.push(`/join/${encodeURIComponent(server.id)}`)} />
          <PixelButton
            label={server.favorite ? "Unfavorite" : "Favorite"}
            tone="gold"
            onPress={() => {
              void toggleFavoriteId(server.id).then(() => {
                setServer({ ...server, favorite: !server.favorite });
              });
            }}
          />
          {server.source === "saved" ? (
            <PixelButton label="Edit" tone="aqua" onPress={() => router.push(`/edit/${encodeURIComponent(server.id)}`)} />
          ) : null}
          {server.source === "saved" ? (
            <PixelButton
              label="Remove"
              tone="red"
              onPress={() => {
                Alert.alert("Remove server", `Remove ${server.name}?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                      void removeSavedServer(server.id).then(() => router.back());
                    },
                  },
                ]);
              }}
            />
          ) : null}
          <PixelButton label="Back" tone="stone" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  title: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 22,
  },
  address: {
    color: colors.aqua,
    fontSize: 22,
    lineHeight: 24,
    marginBottom: 4,
  },
  meta: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 6,
  },
  waiting: {
    color: colors.muted,
    fontSize: 20,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
