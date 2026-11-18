import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditionPicker } from "@/components/EditionPicker";
import { GlassPanel } from "@/components/GlassPanel";
import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import {
  applyStatusAddressHints,
  parseAddress,
  userSpecifiedPort,
} from "@/lib/address";
import { buildAddExternalServerUrlFromParsed } from "@/lib/join";
import { RelayClient } from "@/lib/relayClient";
import { fetchServerStatus } from "@/lib/status";
import type { Edition } from "@/lib/types";
import { loadSettings } from "@/storage/settings";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export default function JoinModalScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    host?: string;
    port?: string;
    edition?: string;
    serverId?: string;
  }>();

  const initialEdition = (params.edition === "bedrock" ? "bedrock" : "java") satisfies Edition;
  const [edition, setEdition] = useState<Edition>(initialEdition);
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState<string | undefined>();

  const addressInput = useMemo(() => {
    const host = params.host ?? "";
    const port = params.port;
    if (port && port !== "25565" && port !== "19132") {
      return `${host}:${port}`;
    }
    return host;
  }, [params.host, params.port]);

  const serverName = params.name ?? "Server";

  const onJoin = useCallback(async () => {
    setBusy(true);
    setStatusLine(undefined);
    try {
      const parsed = parseAddress(addressInput, edition);
      const status = await fetchServerStatus(parsed.host, { edition });
      const withHints = applyStatusAddressHints(
        parsed,
        status,
        edition,
        userSpecifiedPort(addressInput),
      );

      const settings = await loadSettings();
      let joinHost = withHints.host;
      let joinPort = withHints.port;
      let joinDisplayHost = withHints.displayHost;

      if (edition === "java") {
        try {
          const client = new RelayClient({
            baseUrl: settings.relayBaseUrl,
            apiToken: settings.relayToken || undefined,
          });
          const session = await client.createSession({
            javaHost: withHints.host,
            javaPort: withHints.port,
          });
          joinHost = session.bedrockHost;
          joinPort = session.bedrockPort;
          joinDisplayHost = session.bedrockHost;
          setStatusLine(`Relay session ${session.id.slice(0, 8)}…`);
        } catch (err) {
          setStatusLine(
            err instanceof Error ? `Relay unavailable: ${err.message}` : "Relay unavailable",
          );
          Alert.alert(
            "Relay required",
            "Java servers need a running NetherNet relay. Check Settings → relay URL.",
          );
          return;
        }
      }

      const url = buildAddExternalServerUrlFromParsed(serverName, {
        host: joinHost,
        port: joinPort,
        displayHost: joinDisplayHost,
      });
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Join failed", err instanceof Error ? err.message : "Could not open Minecraft");
    } finally {
      setBusy(false);
    }
  }, [addressInput, edition, serverName]);

  const onPickJava = useCallback(() => {
    Alert.alert(
      "Java edition",
      "On this device, copy the server address and add it in the Java multiplayer menu.",
      [{ text: "OK" }],
    );
    setEdition("java");
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Join {serverName}</Text>
          <Text style={styles.lead}>
            Java worlds open in Bedrock via your relay (Geyser). Native Bedrock servers connect directly.
          </Text>
          <EditionPicker value={edition} onChange={setEdition} />
          <GlassPanel style={styles.panel}>
            <Text style={styles.label}>TARGET</Text>
            <Text style={styles.value}>{addressInput || "—"}</Text>
            {statusLine ? <Text style={styles.status}>{statusLine}</Text> : null}
          </GlassPanel>
          <View style={styles.actions}>
            <PixelButton
              label={
                busy
                  ? "OPENING..."
                  : edition === "java"
                    ? "JOIN VIA BEDROCK (RELAY)"
                    : "OPEN MINECRAFT (BEDROCK)"
              }
              onPress={() => void onJoin()}
            />
            {edition === "java" ? (
              <PixelButton label="PC JAVA INSTRUCTIONS" variant="ghost" onPress={onPickJava} />
            ) : null}
            <PixelButton label="CLOSE" variant="ghost" onPress={() => router.back()} />
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
    fontSize: 10,
    color: tubnetColors.text,
  },
  lead: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
  },
  panel: {
    marginTop: tubnetSpacing.sm,
  },
  label: {
    fontFamily: tubnetFonts.display,
    fontSize: 8,
    color: tubnetColors.textMuted,
    marginBottom: tubnetSpacing.xs,
  },
  value: {
    fontFamily: tubnetFonts.body,
    fontSize: 22,
    color: tubnetColors.text,
  },
  status: {
    fontFamily: tubnetFonts.body,
    fontSize: 18,
    color: tubnetColors.warning,
    marginTop: tubnetSpacing.sm,
  },
  actions: {
    gap: tubnetSpacing.sm,
    marginTop: tubnetSpacing.md,
  },
});