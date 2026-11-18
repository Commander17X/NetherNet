import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Screen } from "@/components/Screen";
import { ServerForm } from "@/components/ServerForm";
import { saveDraft } from "@/lib/storage";
import { colors, usePixelFont } from "@/theme";

export default function AddServerScreen() {
  const router = useRouter();
  const pixel = usePixelFont();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { fontFamily: pixel }]}>Add a server</Text>
        <ServerForm
          onSave={async (draft) => {
            const saved = await saveDraft(draft);
            router.push(`/server/${encodeURIComponent(saved.id)}`);
          }}
        />
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
});
