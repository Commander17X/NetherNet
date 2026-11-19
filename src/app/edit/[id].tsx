import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { AppButton } from "@/components/AppButton";
import { PageHeader, Screen } from "@/components/Screen";
import { ServerForm } from "@/components/ServerForm";
import { findServer } from "@/lib/findServer";
import { saveDraft } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, space } from "@/theme";

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function EditServerScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [server, setServer] = useState<ServerEntry | null>(null);
  const [missing, setMissing] = useState(false);
  const id = readId(params.id);

  useEffect(() => {
    let cancelled = false;
    void findServer(id).then((found) => {
      if (cancelled) {
        return;
      }
      if (!found || found.source !== "saved") {
        setMissing(true);
        return;
      }
      setServer(found);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader title="Edit server" />
        {missing ? <Text style={styles.copy}>Only servers you added can be edited.</Text> : null}
        {server ? (
          <ServerForm
            initial={server}
            onSave={async (draft) => {
              await saveDraft(draft, server.id);
              router.back();
            }}
          />
        ) : null}
        <AppButton label="Back" variant="ghost" onPress={() => router.back()} />
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
  copy: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 22,
  },
});
