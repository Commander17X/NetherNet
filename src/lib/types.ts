import type { MotdDisplay } from "./motd";

export type Edition = "java" | "bedrock";

export interface SavedServer {
  id: string;
  name: string;
  /** Raw user input (host, host:port, or [ipv6]:port). */
  address: string;
  edition: Edition;
  addedAt: number;
}

export interface ServerPlayers {
  online: number;
  max: number;
}

export type StatusSource = "mcsrvstat" | "mcstatus";

export interface ServerStatus {
  online: boolean;
  host: string;
  port: number;
  /** Ping target host after SRV/CNAME resolution when known. */
  resolvedHost?: string;
  srv?: boolean;
  ip?: string;
  motd?: MotdDisplay;
  players?: ServerPlayers;
  version?: string;
  protocol?: number;
  source: StatusSource;
  /** True when served from the in-memory status cache. */
  fromCache?: boolean;
  retrievedAt?: number;
}

export type RelayAuthMode = "online" | "offline";

/** Mirrors `SessionRecord` from `relay/src/types.ts`. */
export interface RelaySession {
  id: string;
  javaHost: string;
  javaPort: number;
  authMode: RelayAuthMode;
  bedrockHost: string;
  bedrockPort: number;
  publicHost: string;
  createdAt: string;
  targetKey: string;
}

export interface CreateRelaySessionInput {
  javaHost: string;
  javaPort: number;
  authMode?: RelayAuthMode;
  reuse?: boolean;
}

export interface ParsedAddress {
  host: string;
  port: number;
  /** Host formatted for URLs (IPv6 wrapped in brackets). */
  displayHost: string;
}