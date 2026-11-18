export type AuthMode = 'online' | 'offline';

export interface CreateSessionRequest {
  javaHost: string;
  javaPort: number;
  authMode?: AuthMode;
  /** If true (default), return an existing session for the same target when available. */
  reuse?: boolean;
}

export interface SessionRecord {
  id: string;
  javaHost: string;
  javaPort: number;
  authMode: AuthMode;
  bedrockHost: string;
  bedrockPort: number;
  publicHost: string;
  createdAt: string;
  targetKey: string;
}

export interface GeyserProcessHandle {
  sessionId: string;
  mode: 'standalone' | 'docker';
  pid?: number;
  containerId?: string;
  configPath: string;
}

export interface PublicServerEntry {
  id: string;
  name: string;
  javaHost: string;
  javaPort: number;
  description?: string;
  tags?: string[];
  bedrockHost?: string;
}

export interface PublicServersConfig {
  featured?: PublicServerEntry & { bedrockHost?: string };
  servers: PublicServerEntry[];
}