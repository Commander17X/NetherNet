import AsyncStorage from "@react-native-async-storage/async-storage";

import { addPing, PING_HISTORY_SIZE } from "./pings";

const STORAGE_KEY = "nethernet.pings.v1";
const MAX_SERVERS = 40;

type PingFile = Record<string, number[]>;

let memory: PingFile | null = null;

async function readFile(): Promise<PingFile> {
  if (memory) {
    return memory;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const file: PingFile = {};
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [id, values] of Object.entries(parsed)) {
        if (Array.isArray(values)) {
          file[id] = values.filter((value): value is number => typeof value === "number").slice(-PING_HISTORY_SIZE);
        }
      }
    }
    memory = file;
  } catch {
    memory = {};
  }
  return memory;
}

export async function loadPings(id: string): Promise<number[]> {
  const file = await readFile();
  return file[id] ?? [];
}

export async function recordPing(id: string, value: number | null): Promise<number[]> {
  const file = await readFile();
  const current = file[id] ?? [];
  if (value == null) {
    return current;
  }
  const next = addPing(current, value);
  const trimmed: PingFile = { [id]: next };
  for (const [key, values] of Object.entries(file)) {
    if (Object.keys(trimmed).length >= MAX_SERVERS) {
      break;
    }
    if (key !== id) {
      trimmed[key] = values;
    }
  }
  memory = trimmed;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)).catch(() => undefined);
  return next;
}
