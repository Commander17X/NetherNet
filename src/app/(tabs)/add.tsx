import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";

import { PageHeader, Screen } from "@/components/Screen";
import { ServerForm } from "@/components/ServerForm";
import { useTabContentInset } from "@/components/TabBar";
import { saveDraft } from "@/lib/storage";
import { space } from "@/theme";

export default function AddServerScreen() {
  const router = useRouter();
  const tabInset = useTabContentInset();
  const [formKey, setFormKey] = useState(0);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <PageHeader title="Add server" subtitle="Any Java or Bedrock address, on any port." />
          <ServerForm
            key={formKey}
            onSave={async (draft) => {
              const saved = await saveDraft(draft);
              setFormKey((value) => value + 1);
              router.push(`/server/${encodeURIComponent(saved.id)}`);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: space.md,
    gap: space.lg,
  },
});
