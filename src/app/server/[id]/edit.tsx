import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EditionPicker } from "@/components/EditionPicker";
import { PixelButton } from "@/components/PixelButton";
import { ScreenBackground } from "@/components/ScreenBackground";
import { TextField } from "@/components/TextField";
import { FEATURED_TRIX } from "@/data/featured";
import { parseAddress } from "@/lib/address";
import type { Edition } from "@/lib/types";
import { getServerById, upsertServer } from "@/storage/serversStore";
import { tubnetFonts, tubnetSpacing } from "@/theme/tubnet";

export default function EditServerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [edition, setEdition] = useState<Edition>("java");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id || id === FEATURED_TRIX.id) {
      router.replace("/");
      return;
    }
    void getServerById(id).then((srv) => {
      if (!srv) {
        router.replace("/");
        return;
      }
      setName(srv.name);
      setAddress(srv.address);
      setEdition(srv.edition);
    });
  }, [id]);

  const onSubmit = async () => {
    if (!id) return;
    try {
      parseAddress(address, edition);
    } catch (err) {
      Alert.alert("Invalid address", err instanceof Error ? err.message : "Could not parse");
      return;
    }
    setBusy(true);
    try {
      await upsertServer({ id, name, address, edition });
      router.replace(`/server/${id}`);
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
          <Text style={styles.hint}>Update saved server</Text>
          <TextField label="NAME" value={name} onChangeText={setName} />
          <TextField
            label="ADDRESS"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
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
  submit: { marginTop: tubnetSpacing.lg },
});