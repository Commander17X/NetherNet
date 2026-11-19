import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { MotdText } from "@/components/MotdText";
import { PageHeader, Screen } from "@/components/Screen";
import { ServerIcon, useServerFavicon } from "@/components/ServerIcon";
import { ServerMeta } from "@/components/ServerMeta";
import { findServer } from "@/lib/findServer";
import { formatAddress } from "@/lib/address";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { removeSavedServer, toggleFavoriteId } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { CardSkeleton } from "@/components/Skeleton";

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function ServerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [server, setServer] = useState<ServerEntry | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [missing, setMissing] = useState(false);
  const icon = useServerFavicon(server?.id ?? "", status?.favicon, status?.online);

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
          <PageHeader title="Missing server" />
          <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!server) {
    return (
      <Screen bottomInset>
        <View style={styles.content}>
          <CardSkeleton />
        </View>
      </Screen>
    );
  }

  const typedAddress = server.port == null ? server.host : formatAddress(server.host, server.port);
  const liveAddress = status ? `${status.connectHost}:${status.connectPort}` : typedAddress;
  const edition = server.edition === "auto" ? status?.edition ?? "auto" : server.edition;

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader title={server.name} subtitle={liveAddress} />
        <View style={styles.card}>
          <ServerIcon name={server.name} uri={icon} size={84} />
          {status ? <MotdText lines={status.motd} dim={!status.online} linesToShow={3} /> : <Text style={styles.waiting}>Checking the server</Text>}
          <ServerMeta status={status ?? undefined} players />
          <Text style={styles.meta}>{`${edition} · saved as ${typedAddress}`}</Text>
          {status?.version ? <Text style={styles.meta}>{status.version}</Text> : null}
          {status?.gameMode ? <Text style={styles.meta}>{status.gameMode}</Text> : null}
          {server.description ? <Text style={styles.meta}>{server.description}</Text> : null}
        </View>
        <AppButton label="Join" onPress={() => router.push(`/join/${encodeURIComponent(server.id)}`)} />
        <View style={styles.actions}>
          <View style={styles.action}>
            <AppButton
              label={server.favorite ? "Unfavorite" : "Favorite"}
              variant="secondary"
              onPress={() => {
                void toggleFavoriteId(server.id).then(() => {
                  setServer({ ...server, favorite: !server.favorite });
                });
              }}
            />
          </View>
          {server.source === "saved" ? (
            <View style={styles.action}>
              <AppButton label="Edit" variant="secondary" onPress={() => router.push(`/edit/${encodeURIComponent(server.id)}`)} />
            </View>
          ) : null}
        </View>
        {server.source === "saved" ? (
          <AppButton
            label="Remove"
            variant="danger"
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
        <AppButton label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
    gap: space.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: space.lg,
    gap: space.md,
    alignItems: "flex-start",
  },
  waiting: {
    color: colors.tertiary,
    fontSize: 15,
  },
  meta: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
});
