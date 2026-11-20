import AsyncStorage from "@react-native-async-storage/async-storage";

import { formatAddress, parseServerAddress } from "./address";
import type { AuthMode, EditionChoice, PublicServer, SavedServer, ServerDraft, ServerEntry } from "./types";

const SERVERS_KEY = "nethernet.servers.v1";
const SETTINGS_KEY = "nethernet.settings.v1";
const ONBOARDING_KEY = "nethernet.onboarding.v1";

type StoreFile = {
  servers: SavedServer[];
  favoriteIds: string[];
  /** Copies of starred relay servers, so they stay in Favorites when the relay is away. */
  favoriteServers: PublicServer[];
};

export type AppSettings = {
  relayUrl: string;
  relayToken: string;
};

function isEdition(value: unknown): value is EditionChoice {
  return value === "java" || value === "bedrock" || value === "auto";
}

function isAuth(value: unknown): value is AuthMode {
  return value === "online" || value === "offline";
}

function isPublicServer(value: unknown): value is PublicServer {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<PublicServer>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.host === "string" &&
    (row.port === null || typeof row.port === "number") &&
    (row.edition === "java" || row.edition === "bedrock")
  );
}

function emptyStore(): StoreFile {
  return { servers: [], favoriteIds: [], favoriteServers: [] };
}

function isSavedServer(value: unknown): value is SavedServer {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<SavedServer>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.host === "string" &&
    (row.port === null || typeof row.port === "number") &&
    isEdition(row.edition) &&
    isAuth(row.authMode)
  );
}

async function readStore(): Promise<StoreFile> {
  const raw = await AsyncStorage.getItem(SERVERS_KEY);
  if (!raw) {
    return emptyStore();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    return {
      servers: Array.isArray(parsed.servers) ? parsed.servers.filter(isSavedServer) : [],
      favoriteIds: Array.isArray(parsed.favoriteIds)
        ? parsed.favoriteIds.filter((id): id is string => typeof id === "string")
        : [],
      favoriteServers: Array.isArray(parsed.favoriteServers) ? parsed.favoriteServers.filter(isPublicServer) : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(file: StoreFile): Promise<void> {
  await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(file));
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Runs read-change-write steps one at a time, so two quick taps
 * (or a star tap while a server saves) can't overwrite each other.
 */
function mutate<T>(change: (file: StoreFile) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const file = await readStore();
    const result = await change(file);
    await writeStore(file);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function loadServerFile(): Promise<StoreFile> {
  return readStore();
}

export function createServerId(): string {
  return `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveDraft(draft: ServerDraft, existingId?: string): Promise<SavedServer> {
  const parsed = parseServerAddress(draft.port == null ? draft.host : formatAddress(draft.host, draft.port));
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return mutate((file) => {
    const now = Date.now();
    const current = existingId ? file.servers.find((server) => server.id === existingId) : undefined;
    const next: SavedServer = {
      id: current?.id ?? createServerId(),
      name: draft.name.trim() || parsed.address.host,
      host: parsed.address.host,
      port: parsed.address.port,
      edition: draft.edition,
      authMode: draft.edition === "bedrock" ? "online" : draft.authMode,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    file.servers = [next, ...file.servers.filter((server) => server.id !== next.id)];
    return next;
  });
}

export function removeSavedServer(id: string): Promise<void> {
  return mutate((file) => {
    file.servers = file.servers.filter((server) => server.id !== id);
    file.favoriteIds = file.favoriteIds.filter((favorite) => favorite !== id);
  });
}

function snapshot(server: ServerEntry): PublicServer {
  return {
    id: server.id,
    name: server.name,
    host: server.host,
    port: server.port,
    edition: server.edition === "bedrock" ? "bedrock" : "java",
    authMode: server.authMode,
    description: server.description,
  };
}

/** Stars or unstars any server (featured, relay or your own) and returns the new state. */
export function setFavorite(server: ServerEntry, favorite: boolean): Promise<boolean> {
  return mutate((file) => {
    file.favoriteIds = file.favoriteIds.filter((id) => id !== server.id);
    file.favoriteServers = file.favoriteServers.filter((row) => row.id !== server.id);
    if (favorite) {
      file.favoriteIds = [server.id, ...file.favoriteIds];
      if (server.source === "public") {
        file.favoriteServers = [snapshot(server), ...file.favoriteServers];
      }
    }
    return favorite;
  });
}

export function toggleFavorite(server: ServerEntry): Promise<boolean> {
  return setFavorite(server, !server.favorite);
}

export function defaultRelayUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_RELAY_URL;
  return typeof fromEnv === "string" ? fromEnv.trim() : "";
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  const fallback = { relayUrl: defaultRelayUrl(), relayToken: "" };
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      relayUrl: typeof parsed.relayUrl === "string" ? parsed.relayUrl.trim() : fallback.relayUrl,
      relayToken: typeof parsed.relayToken === "string" ? parsed.relayToken : "",
    };
  } catch {
    return fallback;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const next: AppSettings = {
    relayUrl: settings.relayUrl.trim().replace(/\/+$/, ""),
    relayToken: settings.relayToken.trim(),
  };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "1";
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "1");
}
