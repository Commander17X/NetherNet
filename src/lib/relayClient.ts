import { friendlyError } from "./errors";

export type RelayHealth = {
  ok: boolean;
  geyser: "ready" | "missing";
  java: "ready" | "missing";
  sessions: number;
  publicHost: string;
};

export type RelayPublicServer = {
  id: string;
  name: string;
  host: string;
  port: number | null;
  edition: "java" | "bedrock";
  featured?: boolean;
  authMode?: "online" | "offline";
  description?: string;
};

export type RelaySession = {
  id: string;
  status: "starting" | "ready" | "failed" | "stopped";
  relayHost: string | null;
  relayPort: number | null;
  targetHost: string;
  targetPort: number;
  authMode: "online" | "offline";
  error: string | null;
  expiresAt: string | null;
};

export class RelayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RelayError";
  }
}

export class RelayClient {
  constructor(
    private baseUrl: string,
    private token = "",
  ) {}

  private root(): string {
    return this.baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.root()}${path}`, {
        ...init,
        headers: {
          accept: "application/json",
          ...(init?.body ? { "content-type": "application/json" } : {}),
          ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
          ...(init?.headers ?? {}),
        },
        signal: init?.signal ?? AbortSignal.timeout(15000),
      });
    } catch (error) {
      throw new RelayError(friendlyError(error));
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : `Relay returned ${response.status}.`;
      throw new RelayError(message);
    }

    return body as T;
  }

  health(): Promise<RelayHealth> {
    return this.request<RelayHealth>("/health");
  }

  async listPublicServers(): Promise<RelayPublicServer[]> {
    const body = await this.request<{ servers?: RelayPublicServer[] }>("/servers");
    return Array.isArray(body.servers) ? body.servers : [];
  }

  createSession(input: {
    name: string;
    host: string;
    port: number;
    authMode: "online" | "offline";
  }): Promise<RelaySession> {
    return this.request<RelaySession>("/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  sessionStatus(id: string): Promise<RelaySession> {
    return this.request<RelaySession>(`/sessions/${encodeURIComponent(id)}`);
  }
}
