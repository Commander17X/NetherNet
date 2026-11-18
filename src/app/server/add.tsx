import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditionPicker } from "@/components/EditionPicker";
import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { TextField } from "@/components/TextField";
import { parseAddress } from "@/lib/address";
import type { Edition } from "@/lib/types";
import { upsertServer } from "@/storage/serversStore";
import { tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export default function AddServerScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [edition, setEdition] = useState<Edition>("java");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert("Missing fields", "Name and address are required.");
      return;
    }
    try {
      parseAddress(address, edition);
    } catch (err) {
      Alert.alert("Invalid address", err instanceof Error ? err.message : "Could not parse");
      return;
    }
    setBusy(true);
    try {
      const saved = await upsertServer({ name, address, edition });
      router.replace(`/server/${saved.id}`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hint}>Host, host:port, or [ipv6]:port</Text>
          <TextField label="NAME" value={name} onChangeText={setName} placeholder="My SMP" />
          <TextField
            label="ADDRESS"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="play.example.com"
          />
          <Text style={styles.hint}>Default edition for status queries</Text>
          <EditionPicker value={edition} onChange={setEdition} />
          <PixelButton
            label={busy ? "SAVING..." : "SAVE"}
            onPress={() => void onSubmit()}
            style={styles.submit}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: tubnetSpacing.md },
  hint: {
    fontFamily: tubnetFonts.body,
    fontSize: 18,
    marginBottom: tubnetSpacing.sm,
  },
  submit: {
    marginTop: tubnetSpacing.lg,
  },
});