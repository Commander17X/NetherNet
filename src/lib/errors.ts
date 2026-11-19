const NETWORK = /failed to fetch|network request failed|networkerror|load failed|aborted|timeout|timed out|the relay didn't respond/i;

export function friendlyError(error: unknown, fallback = "Could not reach the relay."): string {
  const raw = error instanceof Error ? error.message.trim() : "";
  if (!raw || NETWORK.test(raw)) {
    return fallback;
  }
  return raw;
}
