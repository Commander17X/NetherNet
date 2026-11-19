import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { plusSprite } from "@/components/hud/sprites";
import { PageHeader, Screen } from "@/components/Screen";
import { ServerForm } from "@/components/ServerForm";
import { CardSkeleton } from "@/components/Skeleton";
import { TopBar } from "@/components/TopBar";
import { findServer } from "@/lib/findServer";
import { saveDraft } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { space } from "@/theme";

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

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <Screen bottomInset bandHeight={164}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <TopBar onBack={goBack} />
          <PageHeader title="Edit server" subtitle={server ? server.name : undefined} kicker={false} />
          {missing ? (
            <EmptyState
              sprite={plusSprite}
              title="Can't edit this one"
              body="Only servers you added yourself can be edited."
              action={{ label: "Back", onPress: goBack }}
            />
          ) : server ? (
            <ServerForm
              initial={server}
              submitLabel="Save changes"
              onSave={async (draft) => {
                await saveDraft(draft, server.id);
                goBack();
              }}
            />
          ) : (
            <View>
              <CardSkeleton />
            </View>
          )}
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
    paddingBottom: space.xxl,
    gap: space.lg,
  },
});
