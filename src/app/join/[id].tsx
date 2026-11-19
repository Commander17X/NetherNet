import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { starSprite } from "@/components/hud/sprites";
import { JoinSessionView } from "@/components/JoinSessionView";
import { Screen } from "@/components/Screen";
import { CardSkeleton } from "@/components/Skeleton";
import { RoundButton } from "@/components/TopBar";
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
      if (found) {
        setServer(found);
      } else {
        setMissing(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  function close() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }

  return (
    <Screen bottomInset band={false}>
      <View style={styles.sheetTop}>
        {Platform.OS === "ios" ? null : <View style={styles.grabber} />}
        <View style={styles.close}>
          <RoundButton icon="close" label="Close" onPress={close} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {missing ? (
          <EmptyState
            sprite={starSprite}
            title="Server not found"
            body="It isn't in your lobby anymore."
            action={{ label: "Close", onPress: close }}
          />
        ) : server ? (
          <JoinSessionView server={server} onClose={close} />
        ) : (
          <CardSkeleton />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sheetTop: {
    alignItems: "center",
    paddingTop: space.sm,
    minHeight: 48,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.fillStrong,
  },
  close: {
    position: "absolute",
    right: space.md,
    top: space.sm,
  },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
});
