import AsyncStorage from "@react-native-async-storage/async-storage";

import { parseFavicon } from "./favicon";

const STORAGE_KEY = "nethernet.favicons.v1";
const MAX_ENTRIES = 40;

type FaviconFile = Record<string, string>;

async function readFile(): Promise<FaviconFile> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const file: FaviconFile = {};
    for (const [id, value] of Object.entries(parsed)) {
      const icon = parseFavicon(value);
      if (icon) {
        file[id] = icon;
      }
    }
    return file;
  } catch {
    return {};
  }
}

export async function cachedFavicon(id: string): Promise<string | null> {
  const file = await readFile();
  return file[id] ?? null;
}

export async function rememberFavicon(id: string, raw: string | null): Promise<string | null> {
  const icon = raw ? parseFavicon(raw) : null;
  const file = await readFile();
  if (icon) {
    const next: FaviconFile = { [id]: icon };
    for (const [key, value] of Object.entries(file)) {
      if (key !== id) {
        next[key] = value;
      }
      if (Object.keys(next).length >= MAX_ENTRIES) {
        break;
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return icon;
  }
  if (id in file) {
    delete file[id];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  }
  return null;
}
