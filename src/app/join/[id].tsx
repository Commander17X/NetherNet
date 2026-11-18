import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { JoinSessionView } from "@/components/JoinSessionView";
import { PixelButton } from "@/components/PixelButton";
import { Screen } from "@/components/Screen";
import { findServer } from "@/lib/findServer";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";

function readId(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? decodeURIComponent(raw) : "";
}

export default function JoinScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pixel = usePixelFont();
  const body = useBodyFont();
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
        <Text style={[styles.title, { fontFamily: pixel }]}>Join</Text>
        {missing ? <Text style={[styles.copy, { fontFamily: body }]}>That server is not in the list anymore.</Text> : null}
        {!server && !missing ? <Text style={[styles.copy, { fontFamily: body }]}>Loading…</Text> : null}
        {server ? <JoinSessionView server={server} /> : null}
        <View style={styles.back}>
          <PixelButton label="Back" tone="stone" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  title: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 22,
  },
  copy: {
    color: colors.ink,
    fontSize: 20,
  },
  back: {
    alignSelf: "flex-start",
  },
});
