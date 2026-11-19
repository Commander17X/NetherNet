import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { PageHeader, Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useTabContentInset } from "@/components/TabBar";
import { friendlyError } from "@/lib/errors";
import { issuesUrl, privacyPolicyUrl, supportUrl } from "@/lib/links";
import { RelayClient } from "@/lib/relayClient";
import { loadSettings, saveSettings } from "@/lib/storage";
import { colors, radius, space } from "@/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const tabInset = useTabContentInset();
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
      setMessage(friendlyError(error));
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabInset }]} keyboardShouldPersistTaps="handled">
        <PageHeader title="Settings" subtitle="The relay is only used for Java servers." />
        <TextField
          label="Relay address"
          value={relayUrl}
          onChangeText={setRelayUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. http://192.168.1.20:8787"
          hint="Use a LAN IP or public hostname the phone can reach."
        />
        <TextField
          label="Relay token"
          value={relayToken}
          onChangeText={setRelayToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          placeholder="e.g. a token, if you set one"
        />
        <View style={[styles.note, { borderColor: tone }]}>
          <Text style={[styles.noteText, { color: tone }]}>{message}</Text>
        </View>
        <AppButton label="Save and check" onPress={() => void check()} />
        <Text style={styles.groupLabel}>More</Text>
        <View style={styles.group}>
          <LinkRow label="How joining works" onPress={() => router.push("/welcome")} />
          <LinkRow label="Privacy policy" onPress={() => void Linking.openURL(privacyPolicyUrl)} />
          <LinkRow label="Support" onPress={() => void Linking.openURL(supportUrl)} />
          <LinkRow label="GitHub issues" onPress={() => void Linking.openURL(issuesUrl)} last />
        </View>
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
  groupLabel: {
    color: colors.tertiary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: -8,
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.stroke,
    overflow: "hidden",
  },
  row: {
    minHeight: 52,
    paddingHorizontal: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.stroke,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 17,
  },
});

function LinkRow({ label, onPress, last = false }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.tertiary} />
    </Pressable>
  );
}
