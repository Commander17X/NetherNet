import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { TextField } from "@/components/TextField";
import { DEFAULT_RELAY_BASE_URL, loadSettings, saveSettings } from "@/storage/settings";
import { tubnetColors, tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export default function SettingsScreen() {
  const [relayBaseUrl, setRelayBaseUrl] = useState(DEFAULT_RELAY_BASE_URL);
  const [relayToken, setRelayToken] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSettings().then((s) => {
      setRelayBaseUrl(s.relayBaseUrl);
      setRelayToken(s.relayToken);
    });
  }, []);

  const onSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveSettings({ relayBaseUrl: relayBaseUrl.trim(), relayToken });
      Alert.alert("Saved", "Relay settings updated.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }, [relayBaseUrl, relayToken]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.lead}>
            Configure the NetherNet relay used when Bedrock players join Java servers.
          </Text>
          <TextField
            label="RELAY URL"
            value={relayBaseUrl}
            onChangeText={setRelayBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={DEFAULT_RELAY_BASE_URL}
          />
          <TextField
            label="RELAY TOKEN"
            value={relayToken}
            onChangeText={setRelayToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            placeholder="Optional bearer token"
            hint="Sent as Authorization when creating relay sessions."
          />
          <PixelButton label={saving ? "SAVING..." : "SAVE"} onPress={() => void onSave()} />
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Token is stored locally on device. Relay server must trust this token (see relay
              .env.example).
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: tubnetSpacing.md,
    gap: tubnetSpacing.sm,
  },
  lead: {
    fontFamily: tubnetFonts.body,
    fontSize: 20,
    color: tubnetColors.textMuted,
    marginBottom: tubnetSpacing.md,
  },
  note: {
    marginTop: tubnetSpacing.lg,
    padding: tubnetSpacing.md,
    borderWidth: 1,
    borderColor: tubnetColors.panelBorder,
    borderRadius: 8,
  },
  noteText: {
    fontFamily: tubnetFonts.body,
    fontSize: 18,
    color: tubnetColors.textMuted,
  },
});