import { Link, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlassPanel } from "@/components/GlassPanel";
import { MotdText } from "@/components/MotdText";
import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { StatusPill } from "@/components/StatusPill";
import { FEATURED_TRIX, featuredAsAddress } from "@/data/featured";
import { useServerStatus } from "@/hooks/useServerStatus";
import { formatHostPort, parseAddress } from "@/lib/address";
import type { Edition, SavedServer } from "@/lib/types";
import { deleteServer, getServerById } from "@/storage/serversStore";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

type ResolvedServer = {
  id: string;
  name: string;
  address: string;
  edition: Edition;
  description?: string;
  featured?: boolean;
};

function resolveServer(id: string | undefined, saved?: SavedServer): ResolvedServer | undefined {
  if (!id) return undefined;
  if (id === FEATURED_TRIX.id) {
    return {
      id: FEATURED_TRIX.id,
      name: FEATURED_TRIX.name,
      address: featuredAsAddress("java"),
      edition: "java",
      description: FEATURED_TRIX.description,
      featured: true,
    };
  }
  if (saved) {
    return {
      id: saved.id,
      name: saved.name,
      address: saved.address,
      edition: saved.edition,
    };
  }
  return undefined;
}

export default function ServerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedServer | undefined>();
  const server = useMemo(() => resolveServer(id, saved), [id, saved]);
  const { status, loading, refresh } = useServerStatus(server?.address, server?.edition ?? "java");

  useEffect(() => {
    if (!id || id === FEATURED_TRIX.id) return;
    void getServerById(id).then(setSaved);
  }, [id]);

  const parsed = useMemo(() => {
    if (!server) return undefined;
    try {
      return parseAddress(server.address, server.edition);
    } catch {
      return undefined;
    }
  }, [server]);

  const onDelete = useCallback(() => {
    if (!server || server.featured) return;
    Alert.alert("Delete server?", server.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteServer(server.id).then(() => router.replace("/"));
        },
      },
    ]);
  }, [server]);

  if (!server) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.missing}>Server not found.</Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const joinParams = {
    name: server.name,
    host: parsed?.host ?? server.address,
    port: String(parsed?.port ?? 25565),
    edition: server.edition,
    serverId: server.id,
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{server.name}</Text>
          {server.description ? <Text style={styles.desc}>{server.description}</Text> : null}
          <GlassPanel>
            <View style={styles.row}>
              <Text style={styles.label}>STATUS</Text>
              <StatusPill online={status?.online} loading={loading} players={status?.players} />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ADDRESS</Text>
              <Text style={styles.value}>
                {parsed ? formatHostPort(parsed) : server.address}
              </Text>
            </View>
            {status?.version ? (
              <View style={styles.row}>
                <Text style={styles.label}>VERSION</Text>
                <Text style={styles.value}>{status.version}</Text>
              </View>
            ) : null}
            <View style={styles.motdBlock}>
              <Text style={styles.label}>MOTD</Text>
              <MotdText motd={status?.motd} />
            </View>
            <PixelButton label="REFRESH" variant="ghost" small onPress={() => void refresh()} />
          </GlassPanel>
          <View style={styles.actions}>
            <Link
              href={{ pathname: "/join", params: joinParams }}
              asChild
            >
              <PixelButton label="JOIN" />
            </Link>
            {!server.featured ? (
              <>
                <Link href={`/server/${server.id}/edit`} asChild>
                  <PixelButton label="EDIT" variant="ghost" />
                </Link>
                <PixelButton label="DELETE" variant="danger" onPress={onDelete} />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: tubnetSpacing.md, gap: tubnetSpacing.md },
  title: {
    fontFamily: tubnetFonts.display,
    fontSize: 12,
    color: tubnetColors.text,
  },
  desc: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tubnetSpacing.sm,
    gap: tubnetSpacing.sm,
  },
  label: {
    fontFamily: tubnetFonts.display,
    fontSize: 8,
    color: tubnetColors.textMuted,
  },
  value: {
    flex: 1,
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.text,
    textAlign: "right",
  },
  motdBlock: {
    marginVertical: tubnetSpacing.sm,
    gap: tubnetSpacing.xs,
  },
  actions: {
    gap: tubnetSpacing.sm,
  },
  missing: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: tubnetColors.textMuted,
    padding: tubnetSpacing.md,
  },
});