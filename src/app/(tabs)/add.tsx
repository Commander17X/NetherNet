import { useRouter } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { useTabContentInset } from "@/components/TabBar";
import { ServerForm } from "@/components/ServerForm";
import { PageHeader, Screen } from "@/components/Screen";
import { saveDraft } from "@/lib/storage";
import { space } from "@/theme";

export default function AddServerScreen() {
  const router = useRouter();
  const tabInset = useTabContentInset();

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabInset }]} keyboardShouldPersistTaps="handled">
        <PageHeader title="Add a server" subtitle="Any Java or Bedrock address." />
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
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
    gap: space.lg,
  },
});
