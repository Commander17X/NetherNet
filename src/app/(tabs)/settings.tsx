import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppButton } from "@/components/AppButton";
import { SectionTitle } from "@/components/EmptyState";
import { GlassPanel } from "@/components/hud/GlassPanel";
import { PixelLabel } from "@/components/hud/PixelLabel";
import { SignalBars } from "@/components/hud/SignalBars";
import { PageHeader, Screen } from "@/components/Screen";
import { useTabContentInset } from "@/components/TabBar";
import { friendlyError } from "@/lib/errors";
import { tap } from "@/lib/haptics";
import { issuesUrl, privacyPolicyUrl, supportUrl } from "@/lib/links";
import { RelayClient, type RelayHealth } from "@/lib/relayClient";
import { loadSettings, saveSettings } from "@/lib/storage";
import { colors, radius, space } from "@/theme";

type RelayCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "empty" }
  | { state: "ok"; health: RelayHealth; ms: number }
  | { state: "error"; message: string };

const SOURCE_URL = "https://github.com/Commander17X/NetherNet";

export default function SettingsScreen() {
  const router = useRouter();
  const tabInset = useTabContentInset();
  const [relayUrl, setRelayUrl] = useState("");
  const [relayToken, setRelayToken] = useState("");
  const [check, setCheck] = useState<RelayCheck>({ state: "idle" });
  const version = Constants.expoConfig?.version ?? "1.0.0";

  useFocusEffect(
    useCallback(() => {
      void loadSettings().then((settings) => {
        setRelayUrl(settings.relayUrl);
        setRelayToken(settings.relayToken);
      });
    }, []),
  );

  async function saveAndCheck() {
    await saveSettings({ relayUrl, relayToken });
    const stored = await loadSettings();
    setRelayUrl(stored.relayUrl);
    setRelayToken(stored.relayToken);
    if (!stored.relayUrl) {
      setCheck({ state: "empty" });
      return;
    }
    setCheck({ state: "checking" });
    const started = Date.now();
    try {
      const health = await new RelayClient(stored.relayUrl, stored.relayToken).health();
      setCheck({ state: "ok", health, ms: Date.now() - started });
      tap("success");
    } catch (error) {
      setCheck({ state: "error", message: friendlyError(error) });
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <PageHeader title="Settings" subtitle="Your relay, guides and the fine print." />

          <SectionTitle>Relay</SectionTitle>
          <GlassPanel style={styles.group}>
            <InputRow
              label="Address"
              value={relayUrl}
              onChangeText={(value) => {
                setRelayUrl(value);
                setCheck({ state: "idle" });
              }}
              placeholder="http://192.168.1.20:8787"
              keyboardType="url"
            />
            <InputRow
              label="Token"
              value={relayToken}
              onChangeText={(value) => {
                setRelayToken(value);
                setCheck({ state: "idle" });
              }}
              placeholder="Optional"
              secure
              last
            />
          </GlassPanel>
          <RelayStatus check={check} />
          <AppButton
            label="Save and test relay"
            icon="pulse"
            busy={check.state === "checking"}
            onPress={() => void saveAndCheck()}
          />
          <Text style={styles.footnote}>
            Only Java servers use the relay. Bedrock servers open straight in Minecraft on the port you typed, or 19132
            for a plain domain.
          </Text>

          <SectionTitle>Help</SectionTitle>
          <GlassPanel style={styles.group}>
            <LinkRow
              icon="book-outline"
              tint="#5AC8FF"
              label="How joining works"
              onPress={() => router.push("/welcome")}
            />
            <LinkRow
              icon="help-buoy-outline"
              tint={colors.online}
              label="Support"
              external
              onPress={() => void Linking.openURL(supportUrl)}
            />
            <LinkRow
              icon="bug-outline"
              tint={colors.offline}
              label="Report a problem"
              external
              onPress={() => void Linking.openURL(issuesUrl)}
              last
            />
          </GlassPanel>

          <SectionTitle>About</SectionTitle>
          <GlassPanel style={styles.group}>
            <LinkRow
              icon="shield-checkmark-outline"
              tint="#B38CFF"
              label="Privacy policy"
              external
              onPress={() => void Linking.openURL(privacyPolicyUrl)}
            />
            <LinkRow
              icon="logo-github"
              tint={colors.text}
              label="Source code"
              external
              onPress={() => void Linking.openURL(SOURCE_URL)}
            />
            <Row icon="information-circle-outline" tint={colors.accent} label="Version" last>
              <Text style={styles.value}>{version}</Text>
            </Row>
          </GlassPanel>

          <View style={styles.signoff}>
            <PixelLabel size={9} color={colors.accent}>
              NETHERNET
            </PixelLabel>
            <Text style={styles.legal}>
              Open source. Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RelayStatus({ check }: { check: RelayCheck }) {
  if (check.state === "idle" || check.state === "checking") {
    return null;
  }
  const tone =
    check.state === "ok"
      ? { color: colors.online, title: "Relay online", icon: "checkmark-circle" as const }
      : check.state === "empty"
        ? { color: colors.warning, title: "No relay saved", icon: "information-circle" as const }
        : { color: colors.danger, title: "Relay unreachable", icon: "close-circle" as const };

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      accessibilityLiveRegion="polite"
      style={[styles.status, { borderColor: `${tone.color}55`, backgroundColor: `${tone.color}12` }]}
    >
      <View style={styles.statusHead}>
        <Ionicons name={tone.icon} size={20} color={tone.color} />
        <Text style={styles.statusTitle}>{tone.title}</Text>
        {check.state === "ok" ? <SignalBars ping={check.ms} /> : null}
      </View>
      {check.state === "ok" ? (
        <View style={styles.statusGrid}>
          <StatusCell label="Host" value={check.health.publicHost} />
          <StatusCell
            label="Geyser"
            value={check.health.geyser === "ready" ? "Ready" : "Missing"}
            warn={check.health.geyser !== "ready"}
          />
          <StatusCell label="Sessions" value={String(check.health.sessions)} />
          <StatusCell label="Reply" value={`${check.ms} ms`} />
        </View>
      ) : (
        <Text style={styles.statusBody}>
          {check.state === "empty" ? "Bedrock servers still join directly. Java servers need a relay." : check.message}
        </Text>
      )}
    </Animated.View>
  );
}

function StatusCell({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.statusCell}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, warn && { color: colors.warning }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Row({
  icon,
  tint,
  label,
  children,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  children?: ReactNode;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={[styles.iconTile, { backgroundColor: `${tint}22`, borderColor: `${tint}44` }]}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LinkRow({
  icon,
  tint,
  label,
  onPress,
  external = false,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  onPress: () => void;
  external?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={external ? "link" : "button"}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.rowPressed]}
    >
      <Row icon={icon} tint={tint} label={label} last={last}>
        <Ionicons name={external ? "open-outline" : "chevron-forward"} size={17} color={colors.tertiary} />
      </Row>
    </Pressable>
  );
}

function InputRow({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  last = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: "url";
  last?: boolean;
}) {
  return (
    <View style={[styles.inputRow, !last && styles.rowDivider]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={`Relay ${label.toLowerCase()}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.accent}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        style={styles.input}
      />
    </View>
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
    gap: space.md,
  },
  group: {
    paddingLeft: space.md,
  },
  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
    paddingRight: space.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.strokeStrong,
  },
  rowPressed: {
    backgroundColor: colors.fill,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
  },
  value: {
    color: colors.secondary,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  inputRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingRight: space.md,
  },
  inputLabel: {
    width: 76,
    color: colors.text,
    fontSize: 17,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontSize: 17,
    textAlign: "right",
  },
  status: {
    gap: space.sm + space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statusHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  statusTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  statusBody: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: space.sm + space.xs,
  },
  statusCell: {
    width: "50%",
    gap: 2,
    paddingRight: space.sm,
  },
  statusLabel: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "700",
  },
  statusValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  footnote: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  signoff: {
    alignItems: "center",
    gap: space.sm,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
  },
  legal: {
    color: colors.tertiary,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
});
