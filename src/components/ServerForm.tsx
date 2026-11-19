import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { formatAddress, parseServerAddress } from "@/lib/address";
import { tap } from "@/lib/haptics";
import { detectEdition } from "@/lib/statusService";
import type { AuthMode, EditionChoice, ServerDraft, ServerEntry } from "@/lib/types";
import { colors, space } from "@/theme";
import { AppButton } from "./AppButton";
import { SegmentedControl } from "./SegmentedControl";
import { TextField } from "./TextField";

const EDITIONS: { value: EditionChoice; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "java", label: "Java" },
  { value: "bedrock", label: "Bedrock" },
];

const AUTH: { value: AuthMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

export function ServerForm({
  initial,
  onSave,
}: {
  initial?: ServerEntry | null;
  onSave: (draft: ServerDraft) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(
    initial ? (initial.port == null ? initial.host : formatAddress(initial.host, initial.port)) : "",
  );
  const [touched, setTouched] = useState(false);
  const [edition, setEdition] = useState<EditionChoice>(initial?.edition ?? "auto");
  const [authMode, setAuthMode] = useState<AuthMode>(initial?.authMode ?? "online");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = parseServerAddress(address);
  const showError = (touched || error != null) && address.trim().length > 0 && !parsed.ok;
  const addressHint = !address.trim()
    ? "Hostname, host:port, or [IPv6]:port"
    : parsed.ok
      ? `${parsed.address.kind} · ${parsed.address.host}${parsed.address.port == null ? " · SRV or the default port" : ` · port ${parsed.address.port}`}`
      : null;

  async function check() {
    setTouched(true);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const found = await detectEdition(parsed.address.host, parsed.address.port);
      if (!found) {
        setHint("Neither edition answered. You can still save it and pick one.");
        return;
      }
      setEdition(found);
      setHint(found === "java" ? "This looks like Java." : "This looks like Bedrock.");
      tap("success");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setTouched(true);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let chosen = edition;
      if (chosen === "auto") {
        const found = await detectEdition(parsed.address.host, parsed.address.port);
        if (found) {
          chosen = found;
        }
      }
      await onSave({
        name: name.trim() || parsed.address.host,
        host: parsed.address.host,
        port: parsed.address.port,
        edition: chosen,
        authMode,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save that server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Weekend realm"
        autoCorrect={false}
      />
      <TextField
        label="Address"
        value={address}
        onChangeText={(value) => {
          setAddress(value);
          setError(null);
        }}
        onBlur={() => setTouched(true)}
        placeholder="e.g. play.example.com"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        error={showError && !parsed.ok ? parsed.error : error}
        hint={hint ?? addressHint}
      />

      <View style={styles.group}>
        <Text style={styles.label}>Edition</Text>
        <SegmentedControl options={EDITIONS} value={edition} onChange={setEdition} />
        <Text style={styles.help}>Auto asks both status APIs. Java uses your relay. Bedrock opens directly.</Text>
      </View>

      {edition !== "bedrock" ? (
        <View style={styles.group}>
          <Text style={styles.label}>Java login</Text>
          <SegmentedControl options={AUTH} value={authMode} onChange={setAuthMode} />
          <Text style={styles.help}>Online uses the Geyser Microsoft login. Offline is for servers that do not check accounts.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton label={busy ? "Checking" : "Check"} variant="secondary" onPress={() => void check()} disabled={busy} />
        </View>
        <View style={styles.action}>
          <AppButton label={busy ? "Saving" : "Save"} onPress={() => void save()} disabled={busy} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.lg,
  },
  group: {
    gap: space.sm,
  },
  label: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  help: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
  },
  action: {
    flex: 1,
  },
});
