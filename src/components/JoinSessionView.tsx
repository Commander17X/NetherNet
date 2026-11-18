import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { buildMinecraftJoinUrl } from "@/lib/joinUrl";
import { RelayClient, type RelaySession } from "@/lib/relayClient";
import { lookupStatus, type ServerStatus } from "@/lib/statusService";
import { loadSettings } from "@/lib/storage";
import type { ServerEntry } from "@/lib/types";
import { colors, useBodyFont, usePixelFont } from "@/theme";
import { MotdText } from "./MotdText";
import { PixelButton } from "./PixelButton";
import { PixelPanel } from "./PixelPanel";

type Phase = "checking" | "starting" | "ready" | "failed";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function JoinSessionView({ server }: { server: ServerEntry }) {
  const pixel = usePixelFont();
  const body = useBodyFont();
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("Checking the server…");
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [target, setTarget] = useState<{ host: string; port: number; via: "relay" | "direct" } | null>(null);
  const [installHelp, setInstallHelp] = useState(false);

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
        setMessage("Bedrock can open this server directly. No relay needed.");
        return;
      }

      const settings = await loadSettings();
      if (!settings.relayUrl) {
        setPhase("failed");
        setMessage("Add your NetherNet relay address in Options. Java servers are opened through that relay.");
        return;
      }

      setPhase("starting");
      setMessage("Asking the relay to open a Geyser session…");
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
          setMessage(session.error || "The relay didn't finish opening a session.");
          return;
        }
        setTarget({ host: session.relayHost, port: session.relayPort, via: "relay" });
        setPhase("ready");
        setMessage("The relay is ready. Open Minecraft and the server will be in your list.");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPhase("failed");
        setMessage(error instanceof Error ? error.message : "Couldn't reach the relay.");
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
      setMessage("Minecraft didn't open. Install it from the App Store, then try again.");
    }
  }

  const tone = phase === "failed" ? colors.red : phase === "ready" ? colors.green : colors.aqua;
  const address = target ? `${target.host}:${target.port}` : status ? `${status.connectHost}:${status.connectPort}` : server.host;

  return (
    <View style={styles.wrap}>
      <PixelPanel accent={phase === "ready" ? colors.green : colors.black}>
        <Text style={[styles.title, { fontFamily: pixel }]}>{server.name}</Text>
        <Text style={[styles.address, { fontFamily: body }]}>{address}</Text>
        {status ? <MotdText lines={status.motd} dim={!status.online} /> : null}
        <Text style={[styles.line, { fontFamily: body, color: tone }]}>{`[!] ${message}`}</Text>
        {target?.via === "relay" && server.authMode === "online" ? (
          <Text style={[styles.help, { fontFamily: body }]}>
            Online Java servers ask for a Microsoft login the first time you join. NetherNet does not use Floodgate. If
            the server is cracked, edit it and switch the login to offline.
          </Text>
        ) : null}
        {target?.via === "direct" ? (
          <Text style={[styles.help, { fontFamily: body }]}>
            This is a direct Bedrock connection{server.port ? ` on port ${target.port}` : ""}. Custom ports and plain
            domains both work.
          </Text>
        ) : null}
        {installHelp ? (
          <Text style={[styles.help, { fontFamily: body, color: colors.yellow }]}>
            Search the App Store for Minecraft. After it is installed, come back and tap Open Minecraft. You can also
            add {address} by hand in the Servers tab of Minecraft.
          </Text>
        ) : null}
      </PixelPanel>
      <PixelButton
        label={phase === "ready" ? "Open Minecraft" : phase === "failed" ? "Not ready" : "Starting"}
        tone={phase === "ready" ? "green" : "stone"}
        disabled={phase !== "ready"}
        onPress={() => void openMinecraft()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  title: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  address: {
    color: colors.aqua,
    fontSize: 20,
    lineHeight: 22,
    marginBottom: 8,
  },
  line: {
    fontSize: 20,
    lineHeight: 24,
    marginTop: 10,
  },
  help: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 22,
    marginTop: 8,
  },
});
