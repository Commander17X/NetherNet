import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { PixelButton } from "@/components/PixelButton";
import { PixelPanel } from "@/components/PixelPanel";
import { Screen } from "@/components/Screen";
import { RelayClient } from "@/lib/relayClient";
import { loadSettings, saveSettings } from "@/lib/storage";
import { colors, useBodyFont, usePixelFont } from "@/theme";

export default function SettingsScreen() {
  const pixel = usePixelFont();
  const body = useBodyFont();
  const [relayUrl, setRelayUrl] = useState("");
  const [relayToken, setRelayToken] = useState("");
  const [message, setMessage] = useState("Java servers join through a NetherNet relay you host.");
  const [tone, setTone] = useState(colors.muted);

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
      setTone(colors.yellow);
      setMessage("No relay saved. Bedrock servers still join directly. Java needs a relay.");
      return;
    }
    try {
      const health = await new RelayClient(stored.relayUrl, stored.relayToken).health();
      setTone(colors.green);
      const geyser = health.geyser === "ready" ? "Geyser jar is in place." : "Geyser jar is missing on the relay.";
      setMessage(`Relay is up at ${health.publicHost}. ${geyser} Open sessions: ${health.sessions}.`);
    } catch (error) {
      setTone(colors.red);
      setMessage(error instanceof Error ? error.message : "Couldn't reach the relay.");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { fontFamily: pixel }]}>Options</Text>
        <PixelPanel>
          <Text style={[styles.label, { fontFamily: pixel }]}>Relay address</Text>
          <TextInput
            value={relayUrl}
            onChangeText={setRelayUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.20:8787"
            placeholderTextColor={colors.dark}
            style={[styles.input, { fontFamily: body }]}
          />
          <Text style={[styles.label, { fontFamily: pixel }]}>Relay token</Text>
          <TextInput
            value={relayToken}
            onChangeText={setRelayToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Only if you set RELAY_TOKEN"
            placeholderTextColor={colors.dark}
            style={[styles.input, { fontFamily: body }]}
          />
          <Text style={[styles.help, { fontFamily: body }]}>
            The phone has to reach this address. Use the LAN IP of your computer while testing, or the public hostname
            once the relay is on a server. Leave the token empty unless the relay requires one.
          </Text>
          <Text style={[styles.help, { fontFamily: body, color: tone }]}>{`[!] ${message}`}</Text>
        </PixelPanel>
        <View style={styles.actions}>
          <PixelButton label="Save and check" tone="gold" onPress={() => void check()} />
        </View>
        <PixelPanel>
          <Text style={[styles.help, { fontFamily: body }]}>
            Bedrock servers open with minecraft:// and the port you typed, or 19132 when you only gave a domain. Java
            servers get a short-lived Geyser session on the relay, then the same Minecraft link points at that session.
          </Text>
        </PixelPanel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  title: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 22,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    lineHeight: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#0A0E18",
    color: colors.white,
    fontSize: 22,
    lineHeight: 26,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#3A4258",
  },
  help: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 10,
  },
  actions: {
    alignSelf: "flex-start",
  },
});
