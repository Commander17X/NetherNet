import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  relayBaseUrl: "@nethernet/relayBaseUrl",
  relayToken: "@nethernet/relayToken",
  servers: "@nethernet/servers",
} as const;

export const DEFAULT_RELAY_BASE_URL = "http://127.0.0.1:8787";

export interface AppSettings {
  relayBaseUrl: string;
  relayToken: string;
}

export async function loadSettings(): Promise<AppSettings> {
  const [relayBaseUrl, relayToken] = await Promise.all([
    AsyncStorage.getItem(KEYS.relayBaseUrl),
    AsyncStorage.getItem(KEYS.relayToken),
  ]);
  return {
    relayBaseUrl: relayBaseUrl ?? DEFAULT_RELAY_BASE_URL,
    relayToken: relayToken ?? "",
  };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next = { ...current, ...partial };
  await Promise.all([
    AsyncStorage.setItem(KEYS.relayBaseUrl, next.relayBaseUrl),
    AsyncStorage.setItem(KEYS.relayToken, next.relayToken),
  ]);
  return next;
}

export { KEYS as settingsStorageKeys };