import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { formatAddress, parseServerAddress } from "@/lib/address";
import { detectEdition } from "@/lib/statusService";
import type { AuthMode, EditionChoice, ServerDraft, ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

const EDITIONS: EditionChoice[] = ["auto", "java", "bedrock"];
const AUTH: AuthMode[] = ["online", "offline"];

export function ServerForm({
  initial,
  onSave,
}: {
  initial?: ServerEntry | null;
  onSave: (draft: ServerDraft) => Promise<void>;
}) {
  const pixel = usePixelFont();
  const body = useBodyFont();
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(
    initial ? (initial.port == null ? initial.host : formatAddress(initial.host, initial.port)) : "",
  );
  const [edition, setEdition] = useState<EditionChoice>(initial?.edition ?? "auto");
  const [authMode, setAuthMode] = useState<AuthMode>(initial?.authMode ?? "online");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = parseServerAddress(address);

  async function check() {
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const found = await detectEdition(parsed.address.host, parsed.address.port);
      if (!found) {
        setHint("Neither Java nor Bedrock answered. You can still save it and pick the edition yourself.");
        return;
      }
      setEdition(found);
      setHint(found === "java" ? "This looks like a Java server." : "This looks like a Bedrock server.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
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
      setError(saveError instanceof Error ? saveError.message : "Couldn't save that server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <PixelPanel>
        <Text style={[styles.label, { fontFamily: pixel }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Trix Islands"
          placeholderTextColor={colors.dark}
          style={[styles.input, { fontFamily: body }]}
          autoCorrect={false}
        />
        <Text style={[styles.label, { fontFamily: pixel }]}>Address</Text>
        <TextInput
          value={address}
          onChangeText={(value) => {
            setAddress(value);
            setError(null);
          }}
          placeholder="play.example.com or [::1]:19132"
          placeholderTextColor={colors.dark}
          style={[styles.input, { fontFamily: body }]}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
        <Text style={[styles.preview, { fontFamily: body, color: parsed.ok ? colors.aqua : colors.red }]}>
          {address.trim().length === 0
            ? "Hostname, host:port, or [IPv6]:port"
            : parsed.ok
              ? `${parsed.address.kind} · ${parsed.address.host}${parsed.address.port == null ? " · port from SRV or the default" : ` · port ${parsed.address.port}`}`
              : parsed.error}
        </Text>

        <Text style={[styles.label, { fontFamily: pixel }]}>Edition</Text>
        <View style={styles.choices}>
          {EDITIONS.map((choice) => (
            <PixelButton
              key={choice}
              compact
              label={choice}
              tone={edition === choice ? "gold" : "stone"}
              onPress={() => setEdition(choice)}
            />
          ))}
        </View>
        <Text style={[styles.help, { fontFamily: body }]}>
          Auto asks both status APIs. Java joins through your relay. Bedrock opens Minecraft directly, on any port.
        </Text>

        {edition !== "bedrock" ? (
          <>
            <Text style={[styles.label, { fontFamily: pixel }]}>Java login</Text>
            <View style={styles.choices}>
              {AUTH.map((choice) => (
                <PixelButton
                  key={choice}
                  compact
                  label={choice}
                  tone={authMode === choice ? "aqua" : "stone"}
                  onPress={() => setAuthMode(choice)}
                />
              ))}
            </View>
            <Text style={[styles.help, { fontFamily: body }]}>
              Online uses the Geyser Microsoft login, without Floodgate. Offline is for servers that do not check accounts.
            </Text>
          </>
        ) : null}

        {hint ? <Text style={[styles.help, { fontFamily: body, color: colors.green }]}>{hint}</Text> : null}
        {error ? <Text style={[styles.help, { fontFamily: body, color: colors.red }]}>{`[!] ${error}`}</Text> : null}
      </PixelPanel>
      <View style={styles.actions}>
        <PixelButton label={busy ? "Working" : "Check"} tone="aqua" onPress={() => void check()} disabled={busy} />
        <PixelButton label={busy ? "Saving" : "Save"} tone="green" onPress={() => void save()} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  label: {
    color: colors.gold,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#0A0E18",
    color: colors.white,
    fontSize: 22,
    lineHeight: 26,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 2,
    borderTopColor: "#05070D",
    borderLeftColor: "#05070D",
    borderRightColor: "#3A4258",
    borderBottomColor: "#3A4258",
  },
  preview: {
    marginTop: 6,
    fontSize: 18,
    lineHeight: 22,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  help: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
});
