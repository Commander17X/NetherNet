import { promises as dns } from "node:dns";

import { defaultPort } from "../../shared/address";
import { pickSrv, resolveSrv, srvName, type SrvRecord } from "../../shared/srv";

export async function resolveJavaTarget(host: string, port: number | null): Promise<{ host: string; port: number }> {
  if (port != null) {
    return { host, port };
  }

  const fromSystem = await resolveSrvRecord(host, "java");
  if (fromSystem) {
    return { host: fromSystem.host, port: fromSystem.port };
  }

  const fromDoh = await resolveSrv(host, "java");
  if (fromDoh) {
    return { host: fromDoh.host, port: fromDoh.port };
  }

  return { host, port: defaultPort("java") };
}

export async function resolveSrvRecord(host: string, edition: "java" | "bedrock"): Promise<SrvRecord | null> {
  try {
    const records = await dns.resolveSrv(srvName(host, edition));
    return pickSrv(
      records.map((record) => ({
        host: record.name.replace(/\.$/, "").toLowerCase(),
        port: record.port,
        priority: record.priority,
        weight: record.weight,
      })),
    );
  } catch {
    return null;
  }
}
