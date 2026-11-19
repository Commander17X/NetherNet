import { formatAddress } from "./address";

const SAFE_NAME = /[^\w .'-]+/g;

export function buildMinecraftJoinUrl(name: string, host: string, port: number): string {
  const cleaned = name.replace(SAFE_NAME, " ").replace(/\s+/g, " ").trim().slice(0, 32);
  const label = cleaned || "NetherNet";
  const address = formatAddress(host, port);
  return `minecraft://?addExternalServer=${encodeURIComponent(label)}|${address}`;
}
