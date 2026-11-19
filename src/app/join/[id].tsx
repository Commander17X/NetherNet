import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { JoinSessionView } from "@/components/JoinSessionView";
import { Screen } from "@/components/Screen";
import { findServer } from "@/lib/findServer";
import type { ServerEntry } from "@/lib/types";
import { colors, space } from "@/theme";

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function JoinScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [server, setServer] = useState<ServerEntry | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void findServer(readId(params.id)).then((found) => {
      if (cancelled) {
        return;
      }
      if (!found) {
        setMissing(true);
        return;
      }
      setServer(found);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <Screen bottomInset>
      <ScrollView contentContainerStyle={styles.content}>
        {missing ? <Text style={styles.copy}>That server is not in the list anymore.</Text> : null}
        {!server && !missing ? <Text style={styles.copy}>Loading</Text> : null}
        {server ? <JoinSessionView server={server} /> : null}
        <View style={styles.back}>
          <AppButton label="Close" variant="ghost" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.md,
    gap: space.md,
    paddingBottom: space.xl,
  },
  copy: {
    color: colors.secondary,
    fontSize: 16,
  },
  back: {
    alignSelf: "center",
  },
});
