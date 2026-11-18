import { useCallback, useEffect, useState } from "react";

import type { SavedServer } from "@/lib/types";
import { listSavedServers } from "@/storage/serversStore";

export function useServers() {
  const [servers, setServers] = useState<SavedServer[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setServers(await listSavedServers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { servers, loading, reload };
}