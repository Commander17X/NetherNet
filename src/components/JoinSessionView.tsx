import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { tap } from "@/lib/haptics";
import { buildMinecraftJoinUrl } from "@/lib/joinUrl";
import { RelayClient, type RelaySession } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadSettings } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { AppButton } from "./AppButton";
import { MotdText } from "./MotdText";
import { ServerIcon, useServerFavicon } from "./ServerIcon";

type Phase = "checking" | "starting" | "ready" | "failed";
type StepState = "waiting" | "current" | "done" | "failed" | "skipped";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STEP_COPY = ["Check server", "Open relay", "Open Minecraft"];

function statesFor(phase: Phase, via: "relay" | "direct" | null): StepState[] {
  if (phase === "checking") {
    return ["current", "waiting", "waiting"];
  }
  if (phase === "starting") {
    return ["done", "current", "waiting"];
  }
  if (phase === "failed") {
    return ["done", "failed", "waiting"];
  }
  return ["done", via === "direct" ? "skipped" : "done", "done"];
}

export function JoinSessionView({ server }: { server: ServerEntry }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Looking up the server.");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [target, setTarget] = useState<{ host: string; port: number; via: "relay" | "direct" } | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const icon = useServerFavicon(server.id, status?.favicon, status?.online);

  useEffect(() => {
    if (phase === "ready") {
      tap("success");
    }
  }, [phase]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const lookedUp = await lookupStatus({
        host: server.host,
        port: server.port,
        edition: server.edition,
        fresh: true,
      });
      if (cancelled) {
        return;
      }
      setStatus(lookedUp);
      const edition = server.edition === "auto" ? lookedUp.edition : server.edition;
      const host = lookedUp.connectHost;
      const port = lookedUp.connectPort;

      if (edition === "bedrock") {
        setTarget({ host, port, via: "direct" });
        setPhase("ready");
        setMessage("Bedrock opens directly. No relay needed.");
        return;
      }

      const settings = await loadSettings();
      if (!settings.relayUrl) {
        setPhase("failed");
        setMessage("Add your relay address in Settings. Java servers open through that relay.");
        return;
      }

      setPhase("starting");
      setMessage("Asking the relay to open a Geyser session.");
      const client = new RelayClient(settings.relayUrl, settings.relayToken);
      try {
        let session: RelaySession = await client.createSession({
          name: server.name,
          host,
          port,
          authMode: server.authMode,
        });
        const deadline = Date.now() + 50000;
        while (session.status === "starting" && Date.now() < deadline) {
          await sleep(1200);
          if (cancelled) {
            return;
          }
          session = await client.sessionStatus(session.id);
          if (session.status === "starting") {
            setMessage("Geyser is starting. This usually takes a few seconds.");
          }
        }
        if (cancelled) {
          return;
        }
        if (session.status !== "ready" || !session.relayHost || !session.relayPort) {
          setPhase("failed");
          setMessage(session.error || "The relay did not finish opening a session.");
          return;
        }
        setTarget({ host: session.relayHost, port: session.relayPort, via: "relay" });
        setPhase("ready");
        setMessage("The relay is ready. Minecraft will add this server to your list.");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPhase("failed");
        setMessage(error instanceof Error ? error.message : "Could not reach the relay.");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [server.authMode, server.edition, server.host, server.name, server.port]);

  async function openMinecraft() {
    if (!target) {
      return;
    }
    const url = buildMinecraftJoinUrl(server.name, target.host, target.port);
    try {
      await Linking.openURL(url);
      setInstallHelp(false);
      setMessage("Minecraft should be open. Tap the server in your list to join.");
    } catch {
      setInstallHelp(true);
      setMessage("Minecraft did not open. Install it from the App Store, then try again.");
    }
  }

  const steps = statesFor(phase, target?.via ?? null);
  const address = target ? `${target.host}:${target.port}` : status ? `${status.connectHost}:${status.connectPort}` : server.host;

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.identity}>
        <ServerIcon name={server.name} uri={icon} size={56} />
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{server.name}</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
      </View>
      {status ? <MotdText lines={status.motd} dim={!status.online} linesToShow={2} /> : null}

      <View style={styles.steps}>
        {STEP_COPY.map((label, index) => (
          <Step key={label} index={index} label={label} state={steps[index] ?? "waiting"} last={index === STEP_COPY.length - 1} />
        ))}
      </View>

      <Text style={styles.message}>{message}</Text>
      {target?.via === "relay" && server.authMode === "online" ? (
        <Text style={styles.help}>
          Online Java servers ask for a Microsoft login the first time. NetherNet does not use Floodgate.
        </Text>
      ) : null}
      {installHelp ? (
        <Text style={styles.help}>
          You can also add {address} by hand in the Servers tab of Minecraft.
        </Text>
      ) : null}

      <AppButton
        label={phase === "ready" ? "Open Minecraft" : phase === "failed" ? "Not ready" : "Starting"}
        variant={phase === "ready" ? "primary" : "secondary"}
        disabled={phase !== "ready"}
        onPress={() => void openMinecraft()}
      />
    </View>
  );
}

function Step({ index, label, state, last }: { index: number; label: string; state: StepState; last: boolean }) {
  const color =
    state === "done" ? colors.online : state === "failed" ? colors.danger : state === "current" ? colors.accent : colors.tertiary;
  return (
        <View accessible accessibilityLabel={`${label}, ${state === "skipped" ? "skipped" : state}`} style={styles.step}>
      <View style={styles.rail}>
        <View style={[styles.dot, { borderColor: color, backgroundColor: state === "done" ? color : "transparent" }]}>
          <Text style={[styles.dotText, { color: state === "done" ? colors.accentInk : color }]}>
            {state === "done" ? "✓" : state === "failed" ? "!" : String(index + 1)}
          </Text>
        </View>
        {last ? null : <View style={[styles.line, { backgroundColor: state === "done" ? colors.online : colors.stroke }]} />}
      </View>
      <View style={styles.stepCopy}>
        <Text style={[styles.stepLabel, state === "current" && styles.stepCurrent]}>{label}</Text>
        <Text style={styles.stepState}>{state === "skipped" ? "Skipped" : state === "current" ? "In progress" : state === "done" ? "Done" : state === "failed" ? "Failed" : "Waiting"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fillStrong,
  },
  identity: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
  },
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  address: {
    color: colors.secondary,
    fontSize: 14,
  },
  steps: {
    gap: 0,
    marginTop: space.xs,
  },
  step: {
    flexDirection: "row",
    gap: space.sm + 4,
  },
  rail: {
    width: 28,
    alignItems: "center",
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 12,
    fontWeight: "700",
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginVertical: 4,
  },
  stepCopy: {
    flex: 1,
    paddingBottom: space.md,
  },
  stepLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  stepCurrent: {
    color: colors.accent,
  },
  stepState: {
    color: colors.tertiary,
    fontSize: 13,
    marginTop: 2,
  },
  message: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  help: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
});
