import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { formatAddress } from "@/lib/address";
import { friendlyError } from "@/lib/errors";
import { parseFavicon } from "@/lib/favicon";
import { tap } from "@/lib/haptics";
import { buildMinecraftAddServerUrl, buildMinecraftConnectUrl } from "@/lib/joinUrl";
import { RelayClient, type RelaySession } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadSettings } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, radius, space } from "@/theme";
import { AppButton } from "./AppButton";
import { GlassPanel } from "./hud/GlassPanel";
import { PixelLabel } from "./hud/PixelLabel";
import { MotdText } from "./MotdText";
import { EditionChip } from "./ServerMeta";
import { ServerIcon } from "./ServerIcon";

type Phase = "checking" | "starting" | "ready" | "failed";
type StepState = "waiting" | "current" | "done" | "failed" | "skipped";
type FailureKind = "no-relay" | "relay-down" | "session";
type Target = { host: string; port: number; via: "relay" | "direct" };

const STEPS = [
  { title: "Find the server", detail: "Status and the real address" },
  { title: "Open a relay session", detail: "Java servers get a Geyser bridge" },
  { title: "Open Minecraft", detail: "Bedrock connects you straight in" },
];

const FAILURES: Record<FailureKind, { title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  "no-relay": { title: "No relay set up yet", icon: "git-network-outline" },
  "relay-down": { title: "The relay didn't answer", icon: "cloud-offline-outline" },
  session: { title: "The session didn't start", icon: "warning-outline" },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statesFor(phase: Phase, via: Target["via"] | null): StepState[] {
  if (phase === "checking") {
    return ["current", "waiting", "waiting"];
  }
  if (phase === "starting") {
    return ["done", "current", "waiting"];
  }
  if (phase === "failed") {
    return ["done", "failed", "waiting"];
  }
  return ["done", via === "direct" ? "skipped" : "done", "current"];
}

function progressFor(phase: Phase): number {
  return phase === "checking" ? 0.2 : phase === "starting" ? 0.55 : phase === "ready" ? 1 : 0.55;
}

export function JoinSessionView({ server, onClose }: { server: ServerEntry; onClose: () => void }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Looking up the server.");
  const [failure, setFailure] = useState<FailureKind | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [opened, setOpened] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const autoOpened = useRef(-1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(progressFor(phase), { duration: 600 });
    if (phase === "ready") {
      tap("success");
    }
  }, [phase, progress]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  useEffect(() => {
    let cancelled = false;

    function fail(kind: FailureKind, text: string) {
      setFailure(kind);
      setPhase("failed");
      setMessage(text);
      tap("light");
    }

    async function run() {
      setPhase("checking");
      setFailure(null);
      setTarget(null);
      setOpened(false);
      setInstallHelp(false);
      setMessage("Looking up the server.");
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
        setMessage(`Bedrock server on port ${port}. It opens directly, no relay needed.`);
        return;
      }

      const settings = await loadSettings();
      if (cancelled) {
        return;
      }
      if (!settings.relayUrl) {
        fail("no-relay", "Java servers open through a relay you host. Add its address in Settings, then try again.");
        return;
      }

      setPhase("starting");
      setMessage("Asking the relay to open a Geyser session.");
      const client = new RelayClient(settings.relayUrl, settings.relayToken);
      let session: RelaySession;
      try {
        session = await client.createSession({ name: server.name, host, port, authMode: server.authMode });
      } catch (error) {
        if (!cancelled) {
          fail(
            "relay-down",
            `${friendlyError(error)} Check that it's running and your phone can reach ${settings.relayUrl}.`,
          );
        }
        return;
      }
      try {
        const deadline = Date.now() + 50_000;
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
      } catch (error) {
        if (!cancelled) {
          fail("relay-down", friendlyError(error, "Lost contact with the relay while it was starting."));
        }
        return;
      }
      if (cancelled) {
        return;
      }
      if (session.status !== "ready" || !session.relayHost || !session.relayPort) {
        fail("session", session.error || "The relay didn't finish opening a session in time.");
        return;
      }
      setTarget({ host: session.relayHost, port: session.relayPort, via: "relay" });
      setPhase("ready");
      setMessage("Your relay session is ready.");
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [attempt, server.authMode, server.edition, server.host, server.name, server.port]);

  async function launch(url: string): Promise<boolean> {
    try {
      if (!(await Linking.canOpenURL(url))) {
        throw new Error("Minecraft is not installed");
      }
      await Linking.openURL(url);
      setInstallHelp(false);
      return true;
    } catch {
      setInstallHelp(true);
      setMessage("Minecraft didn't open. Install it from the App Store, or add the address by hand.");
      return false;
    }
  }

  async function openMinecraft() {
    if (!target) {
      return;
    }
    if (await launch(buildMinecraftConnectUrl(target.host, target.port))) {
      setOpened(true);
      setMessage("Minecraft is connecting you now. Come back here if you need the address again.");
    }
  }

  async function addToList() {
    if (!target) {
      return;
    }
    if (await launch(buildMinecraftAddServerUrl(server.name, target.host, target.port))) {
      tap("success");
      setAdded(true);
      setMessage(`${server.name} is in your Minecraft server list. Find it under Play, then Servers.`);
    }
  }

  useEffect(() => {
    if (phase === "ready" && target && autoOpened.current !== attempt) {
      autoOpened.current = attempt;
      void openMinecraft();
    }
    // openMinecraft only reads target, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target, attempt]);

  async function copyTarget() {
    if (!target) {
      return;
    }
    await Clipboard.setStringAsync(formatAddress(target.host, target.port));
    tap("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const steps = statesFor(phase, target?.via ?? null);
  const edition = server.edition === "auto" && status ? status.edition : server.edition;
  const icon = status?.favicon ? parseFavicon(status.favicon) : null;
  const shownAddress = target
    ? formatAddress(target.host, target.port)
    : status
      ? formatAddress(status.connectHost, status.connectPort)
      : server.host;

  return (
    <View style={styles.wrap}>
      <View style={styles.identity}>
        <ServerIcon name={server.name} uri={icon} size={60} />
        <View style={styles.identityCopy}>
          <Text accessibilityRole="header" style={styles.name} numberOfLines={1}>
            Joining {server.name}
          </Text>
          <View style={styles.identityMeta}>
            <EditionChip edition={edition} />
            <Text style={styles.address} numberOfLines={1}>
              {shownAddress}
            </Text>
          </View>
        </View>
      </View>

      {status && status.motd.length > 0 ? (
        <View style={styles.motd}>
          <MotdText lines={status.motd} dim={!status.online} linesToShow={2} size={15} centered />
        </View>
      ) : null}

      <GlassPanel style={styles.panel}>
        <View style={styles.progressRow}>
          <PixelLabel
            size={7}
            color={phase === "failed" ? colors.danger : phase === "ready" ? colors.xp : colors.accent}
          >
            {phase === "failed" ? "STOPPED" : phase === "ready" ? "READY" : "CONNECTING"}
          </PixelLabel>
          <Text style={styles.progressStep}>Step {phase === "checking" ? 1 : phase === "ready" ? 3 : 2} of 3</Text>
        </View>
        <View
          style={styles.track}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progressFor(phase) * 100) }}
        >
          <Animated.View
            style={[styles.fill, { backgroundColor: phase === "failed" ? colors.danger : colors.xp }, progressStyle]}
          />
        </View>
        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <Step
              key={step.title}
              index={index}
              title={step.title}
              detail={step.detail}
              state={steps[index] ?? "waiting"}
            />
          ))}
        </View>
      </GlassPanel>

      {failure ? (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.failure} accessibilityLiveRegion="assertive">
          <View style={styles.failureHead}>
            <Ionicons name={FAILURES[failure].icon} size={22} color={colors.danger} />
            <Text style={styles.failureTitle}>{FAILURES[failure].title}</Text>
          </View>
          <Text style={styles.failureBody}>{message}</Text>
          <View style={styles.failureActions}>
            {failure === "no-relay" ? (
              <>
                <AppButton
                  label="Set up relay"
                  icon="settings-outline"
                  onPress={() => {
                    onClose();
                    router.navigate("/settings");
                  }}
                />
                <AppButton
                  label="Try again"
                  icon="refresh"
                  variant="secondary"
                  onPress={() => setAttempt((value) => value + 1)}
                />
              </>
            ) : (
              <>
                <AppButton label="Try again" icon="refresh" onPress={() => setAttempt((value) => value + 1)} />
                <AppButton
                  label="Check relay settings"
                  icon="settings-outline"
                  variant="secondary"
                  onPress={() => {
                    onClose();
                    router.navigate("/settings");
                  }}
                />
              </>
            )}
          </View>
        </Animated.View>
      ) : (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      )}

      {phase === "ready" && target ? (
        <Animated.View entering={FadeInDown.duration(260)} style={styles.ready}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy ${shownAddress}`}
            onPress={() => void copyTarget()}
            style={styles.addressBox}
          >
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>{target.via === "relay" ? "Relay address" : "Server address"}</Text>
              <Text style={styles.addressValue} numberOfLines={1}>
                {shownAddress}
              </Text>
            </View>
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={18}
              color={copied ? colors.online : colors.secondary}
            />
          </Pressable>
          <AppButton
            label={opened ? "Join again" : "Join in Minecraft"}
            icon="game-controller"
            onPress={() => void openMinecraft()}
          />
          <AppButton
            label={added ? "Added to server list" : "Add to Minecraft server list"}
            icon={added ? "checkmark" : "add-circle-outline"}
            variant="secondary"
            onPress={() => void addToList()}
          />
          {target.via === "relay" && server.authMode === "online" ? (
            <Text style={styles.help}>
              The first time you join an online Java server, Bedrock may ask you to sign in with Microsoft.
            </Text>
          ) : null}
          {installHelp ? (
            <Text style={styles.help}>
              In Minecraft, open Play, then Servers, then Add Server, and paste the address.
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      {phase === "checking" || phase === "starting" ? (
        <AppButton label="Cancel" variant="ghost" onPress={onClose} />
      ) : null}
    </View>
  );
}

function Step({ index, title, detail, state }: { index: number; title: string; detail: string; state: StepState }) {
  const color =
    state === "done"
      ? colors.xp
      : state === "failed"
        ? colors.danger
        : state === "current"
          ? colors.accent
          : colors.tertiary;
  const stateText = { done: "Done", failed: "Failed", current: "Now", skipped: "Not needed", waiting: "Waiting" }[
    state
  ];
  return (
    <View accessible accessibilityLabel={`Step ${index + 1}, ${title}: ${stateText}`} style={styles.step}>
      <View
        style={[
          styles.slot,
          { borderColor: color },
          state === "done" && { backgroundColor: "rgba(124,240,58,0.14)" },
          state === "current" && { backgroundColor: colors.accentSoft },
          state === "failed" && { backgroundColor: colors.dangerSoft },
        ]}
      >
        {state === "done" ? (
          <Ionicons name="checkmark" size={16} color={color} />
        ) : state === "failed" ? (
          <Ionicons name="close" size={16} color={color} />
        ) : state === "skipped" ? (
          <Ionicons name="remove" size={16} color={color} />
        ) : (
          <PixelLabel size={8} color={color}>
            {String(index + 1)}
          </PixelLabel>
        )}
      </View>
      <View style={styles.stepCopy}>
        <Text
          style={[styles.stepTitle, state === "waiting" && styles.stepMuted, state === "skipped" && styles.stepMuted]}
        >
          {title}
        </Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
      <Text style={[styles.stepState, { color }]}>{stateText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.md,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  identityCopy: {
    flex: 1,
    gap: space.xs + 2,
  },
  identityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  address: {
    flexShrink: 1,
    color: colors.secondary,
    fontSize: 14,
    fontWeight: "500",
  },
  motd: {
    paddingVertical: space.sm + space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  panel: {
    padding: space.md,
    gap: space.md,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressStep: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    height: 8,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.8)",
    overflow: "hidden",
    marginTop: -space.sm,
  },
  fill: {
    height: "100%",
  },
  steps: {
    gap: space.sm + space.xs,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + space.xs,
  },
  slot: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  stepCopy: {
    flex: 1,
    gap: 1,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  stepMuted: {
    color: colors.secondary,
  },
  stepDetail: {
    color: colors.tertiary,
    fontSize: 13,
  },
  stepState: {
    fontSize: 12,
    fontWeight: "700",
  },
  message: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  failure: {
    gap: space.sm + space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,92,92,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,92,92,0.3)",
  },
  failureHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  failureTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  failureBody: {
    color: colors.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  failureActions: {
    gap: space.sm,
    marginTop: space.xs,
  },
  ready: {
    gap: space.sm + space.xs,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  addressCopy: {
    flex: 1,
    gap: 2,
  },
  addressLabel: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: "700",
  },
  addressValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  help: {
    color: colors.tertiary,
    fontSize: 13,
    lineHeight: 18,
  },
});
