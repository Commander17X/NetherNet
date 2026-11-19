import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { PageHeader, Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { RelayClient } from "@/lib/relayClient";
import { loadSettings, saveSettings } from "@/lib/storage";
import { colors, radius, space } from "@/theme";

export default function SettingsScreen() {
  const [relayUrl, setRelayUrl] = useState("");
  const [relayToken, setRelayToken] = useState("");
  const [message, setMessage] = useState("Java servers join through a NetherNet relay you host.");
  const [tone, setTone] = useState(colors.secondary);

  useFocusEffect(
    useCallback(() => {
      void loadSettings().then((settings) => {
        setRelayUrl(settings.relayUrl);
        setRelayToken(settings.relayToken);
      });
    }, []),
  );

  async function persist(): Promise<{ relayUrl: string; relayToken: string }> {
    const next = { relayUrl, relayToken };
    await saveSettings(next);
    const stored = await loadSettings();
    setRelayUrl(stored.relayUrl);
    setRelayToken(stored.relayToken);
    return stored;
  }

  async function check() {
    const stored = await persist();
    if (!stored.relayUrl) {
      setTone(colors.warning);
      setMessage("No relay saved. Bedrock servers still join directly. Java needs a relay.");
      return;
    }
    try {
      const health = await new RelayClient(stored.relayUrl, stored.relayToken).health();
      setTone(colors.online);
      const geyser = health.geyser === "ready" ? "Geyser is installed." : "The Geyser jar is missing on the relay.";
      setMessage(`Relay is up at ${health.publicHost}. ${geyser} Open sessions: ${health.sessions}.`);
    } catch (error) {
      setTone(colors.danger);
      setMessage(error instanceof Error ? error.message : "Could not reach the relay.");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader title="Settings" subtitle="The relay is only used for Java servers." />
        <TextField
          label="Relay address"
          value={relayUrl}
          onChangeText={setRelayUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.1.20:8787"
          hint="Use a LAN IP or public hostname the phone can reach."
        />
        <TextField
          label="Relay token"
          value={relayToken}
          onChangeText={setRelayToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="Only if you set RELAY_TOKEN"
        />
        <View style={[styles.note, { borderColor: tone }]}>
          <Text style={[styles.noteText, { color: tone }]}>{message}</Text>
        </View>
        <AppButton label="Save and check" onPress={() => void check()} />
        <Text style={styles.help}>
          Bedrock opens with minecraft:// on the port you typed, or 19132 for a plain domain. Java gets a short Geyser session, then the same link points at the relay.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
    gap: space.lg,
  },
  note: {
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.fill,
    padding: space.md,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 21,
  },
  help: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
});
