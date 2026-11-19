import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { defaultPort, formatAddress, parseServerAddress } from "@/lib/address";
import { parseFavicon } from "@/lib/favicon";
import { tap } from "@/lib/haptics";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import type { AuthMode, EditionChoice, ServerDraft, ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { AppButton } from "./AppButton";
import { GlassPanel } from "./hud/GlassPanel";
import { PixelLabel } from "./hud/PixelLabel";
import { SignalBars } from "./hud/SignalBars";
import { MotdText } from "./MotdText";
import { SegmentedControl } from "./SegmentedControl";
import { EditionChip, PlayerMeter } from "./ServerMeta";
import { ServerIcon } from "./ServerIcon";
import { TextField } from "./TextField";

const EDITIONS: {
  value: EditionChoice;
  label: string;
  icon: "cube-outline" | "phone-portrait-outline" | "sparkles-outline";
}[] = [
  { value: "java", label: "Java", icon: "cube-outline" },
  { value: "bedrock", label: "Bedrock", icon: "phone-portrait-outline" },
  { value: "auto", label: "Auto", icon: "sparkles-outline" },
];

const AUTH: { value: AuthMode; label: string }[] = [
  { value: "online", label: "Microsoft login" },
  { value: "offline", label: "Offline mode" },
];

const EXAMPLES = ["play.trix-islands.gg", "mc.example.net:25570", "192.168.1.20:19132"];

const EDITION_HELP: Record<EditionChoice, string> = {
  java: "Java servers open in Bedrock through your relay.",
  bedrock: "Bedrock servers open directly. Any port works.",
  auto: "NetherNet asks both editions and picks the one that answers.",
};

type Preview = { status: ServerStatus; name: string } | { error: string };

export function ServerForm({
  initial,
  onSave,
  submitLabel = "Save server",
}: {
  initial?: ServerEntry | null;
  onSave: (draft: ServerDraft) => Promise<void>;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(
    initial ? (initial.port == null ? initial.host : formatAddress(initial.host, initial.port)) : "",
  );
  const [touched, setTouched] = useState(false);
  const [edition, setEdition] = useState<EditionChoice>(initial?.edition ?? "auto");
  const [authMode, setAuthMode] = useState<AuthMode>(initial?.authMode ?? "online");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  const trimmed = address.trim();
  const parsed = parseServerAddress(address);
  const addressError = touched && trimmed.length > 0 && !parsed.ok ? parsed.error : null;
  const fieldState = !trimmed ? "idle" : parsed.ok ? "valid" : touched ? "invalid" : "idle";
  const route = parsed.ok
    ? parsed.address.port == null
      ? edition === "bedrock"
        ? `Joins ${parsed.address.host} on port ${defaultPort("bedrock")}`
        : `Joins ${parsed.address.host} using its SRV record or the default port`
      : `Joins ${parsed.address.host} on port ${parsed.address.port}`
    : null;

  function changeAddress(value: string) {
    setAddress(value);
    setSaveError(null);
    setPreview(null);
  }

  async function check() {
    setTouched(true);
    if (!parsed.ok) {
      return;
    }
    setChecking(true);
    setPreview(null);
    try {
      const status = await lookupStatus({ host: parsed.address.host, port: parsed.address.port, edition, fresh: true });
      if (status.unreachable && !status.online) {
        setPreview({ error: "Neither status service could reach it. Check the address, or save it anyway." });
        tap("light");
        return;
      }
      if (edition === "auto") {
        setEdition(status.edition);
      }
      setPreview({ status, name: name.trim() || parsed.address.host });
      tap("success");
    } finally {
      setChecking(false);
    }
  }

  async function save() {
    setTouched(true);
    if (!parsed.ok) {
      setSaveError(trimmed ? parsed.error : "Type an address first.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let chosen = edition;
      if (chosen === "auto") {
        const status =
          preview && "status" in preview
            ? preview.status
            : await lookupStatus({
                host: parsed.address.host,
                port: parsed.address.port,
                edition: "auto",
                fresh: true,
              });
        if (!status.unreachable || status.online) {
          chosen = status.edition;
        }
      }
      await onSave({
        name: name.trim() || parsed.address.host,
        host: parsed.address.host,
        port: parsed.address.port,
        edition: chosen,
        authMode,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save that server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <GlassPanel style={styles.panel}>
        <TextField
          label="Address"
          value={address}
          onChangeText={changeAddress}
          onBlur={() => setTouched(true)}
          placeholder="play.example.com:25565"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          keyboardType="url"
          returnKeyType="done"
          state={fieldState}
          error={addressError}
          hint={route ?? "A domain, IP, or host:port. IPv6 goes in [brackets]."}
        />
        {!trimmed ? (
          <View style={styles.examples}>
            {EXAMPLES.map((example) => (
              <Pressable
                key={example}
                accessibilityRole="button"
                accessibilityLabel={`Use ${example}`}
                onPress={() => {
                  tap("light");
                  changeAddress(example);
                }}
                style={({ pressed }) => [styles.example, pressed && styles.examplePressed]}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder={parsed.ok ? parsed.address.host : "Weekend realm"}
          autoCorrect={false}
          returnKeyType="done"
          hint="Optional. Shown in your lobby."
        />
      </GlassPanel>

      <GlassPanel style={styles.panel}>
        <View style={styles.group}>
          <Text style={styles.label}>Edition</Text>
          <SegmentedControl
            label="Edition"
            options={EDITIONS}
            value={edition}
            onChange={(value) => {
              setEdition(value);
              setPreview(null);
            }}
          />
          <Text style={styles.help}>{EDITION_HELP[edition]}</Text>
        </View>
        {edition !== "bedrock" ? (
          <View style={styles.group}>
            <Text style={styles.label}>Java login</Text>
            <SegmentedControl label="Java login" options={AUTH} value={authMode} onChange={setAuthMode} />
            <Text style={styles.help}>
              {authMode === "online"
                ? "For most public servers. Bedrock asks you to sign in with Microsoft the first time."
                : "For cracked or offline-mode servers that don't check accounts."}
            </Text>
          </View>
        ) : null}
      </GlassPanel>

      {preview ? (
        <Animated.View entering={FadeInDown.duration(260)}>
          {"status" in preview ? (
            <PreviewCard name={preview.name} status={preview.status} />
          ) : (
            <View style={styles.previewError} accessibilityLiveRegion="polite">
              <PixelLabel size={7} color={colors.warning}>
                NO ANSWER
              </PixelLabel>
              <Text style={styles.previewErrorText}>{preview.error}</Text>
            </View>
          )}
        </Animated.View>
      ) : null}

      {saveError ? (
        <Animated.Text entering={FadeIn} accessibilityLiveRegion="polite" style={styles.saveError}>
          {saveError}
        </Animated.Text>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton
            label="Check"
            icon="pulse"
            variant="secondary"
            busy={checking}
            disabled={!parsed.ok || saving}
            onPress={() => void check()}
          />
        </View>
        <View style={styles.actionWide}>
          <AppButton
            label={submitLabel}
            icon="checkmark"
            busy={saving}
            disabled={checking}
            onPress={() => void save()}
          />
        </View>
      </View>
    </View>
  );
}

function PreviewCard({ name, status }: { name: string; status: ServerStatus }) {
  const offline = !status.online;
  return (
    <GlassPanel style={styles.preview}>
      <View accessibilityLiveRegion="polite" style={styles.previewTop}>
        <ServerIcon name={name} uri={status.favicon ? parseFavicon(status.favicon) : null} size={48} />
        <View style={styles.previewCopy}>
          <Text style={styles.previewName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.previewMeta} numberOfLines={1}>
            {offline
              ? "Found, but offline right now"
              : `${status.version ?? "Unknown version"} · ${status.connectHost}:${status.connectPort}`}
          </Text>
        </View>
        <SignalBars ping={status.pingMs} offline={offline} />
      </View>
      <MotdText lines={status.motd} dim={offline} linesToShow={2} size={14} />
      <View style={styles.previewFooter}>
        <EditionChip edition={status.edition} />
        <PlayerMeter status={status} height={7} />
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
  panel: {
    padding: space.md,
    gap: space.lg,
  },
  group: {
    gap: space.sm,
  },
  label: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  help: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  examples: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: -space.sm,
  },
  example: {
    paddingHorizontal: space.sm + space.xs,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.fill,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  examplePressed: {
    backgroundColor: colors.fillStrong,
  },
  exampleText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  preview: {
    padding: space.md,
    gap: space.sm + space.xs,
    borderColor: "rgba(67,224,140,0.35)",
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  previewCopy: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  previewMeta: {
    color: colors.tertiary,
    fontSize: 13,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  previewError: {
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentLine,
  },
  previewErrorText: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  saveError: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
  actionWide: {
    flex: 1.6,
  },
});
