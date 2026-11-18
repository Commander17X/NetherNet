import { useCallback, useEffect, useState } from "react";

import { parseAddress } from "@/lib/address";
import { fetchServerStatus } from "@/lib/status";
import type { Edition, ServerStatus } from "@/lib/types";

export function useServerStatus(hostInput: string | undefined, edition: Edition = "java") {
  const [status, setStatus] = useState<ServerStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    if (!hostInput?.trim()) {
      setStatus(undefined);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const { host } = parseAddress(hostInput, edition);
      const next = await fetchServerStatus(host, { edition, bypassCache: true });
      setStatus(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status failed");
    } finally {
      setLoading(false);
    }
  }, [hostInput, edition]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}