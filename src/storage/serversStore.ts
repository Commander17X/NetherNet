import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Edition, SavedServer } from "@/lib/types";

import { settingsStorageKeys } from "./settings";

function newId(): string {
  return `srv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listSavedServers(): Promise<SavedServer[]> {
  const raw = await AsyncStorage.getItem(settingsStorageKeys.servers);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as SavedServer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persist(servers: SavedServer[]): Promise<void> {
  await AsyncStorage.setItem(settingsStorageKeys.servers, JSON.stringify(servers));
}

export interface UpsertServerInput {
  id?: string;
  name: string;
  address: string;
  edition: Edition;
}

export async function upsertServer(input: UpsertServerInput): Promise<SavedServer> {
  const servers = await listSavedServers();
  const now = Date.now();
  if (input.id) {
    const idx = servers.findIndex((s) => s.id === input.id);
    const updated: SavedServer = {
      id: input.id,
      name: input.name.trim(),
      address: input.address.trim(),
      edition: input.edition,
      addedAt: idx >= 0 ? (servers[idx]?.addedAt ?? now) : now,
    };
    if (idx >= 0) {
      servers[idx] = updated;
    } else {
      servers.push(updated);
    }
    await persist(servers);
    return updated;
  }
  const created: SavedServer = {
    id: newId(),
    name: input.name.trim(),
    address: input.address.trim(),
    edition: input.edition,
    addedAt: now,
  };
  servers.push(created);
  await persist(servers);
  return created;
}

export async function deleteServer(id: string): Promise<void> {
  const servers = await listSavedServers();
  await persist(servers.filter((s) => s.id !== id));
}

export async function getServerById(id: string): Promise<SavedServer | undefined> {
  return (await listSavedServers()).find((s) => s.id === id);
}