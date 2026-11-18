import type { CreateRelaySessionInput, RelaySession } from "./types";

type FetchLike = typeof fetch;

export class RelayClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RelayClientError";
    this.status = status;
  }
}

export interface RelayClientOptions {
  baseUrl: string;
  apiToken?: string;
  fetch?: FetchLike;
}

export class RelayClient {
  private readonly baseUrl: string;
  private readonly apiToken: string | undefined;
  private readonly fetchFn: FetchLike;

  constructor(options: RelayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiToken = options.apiToken?.trim() || undefined;
    this.fetchFn = options.fetch ?? fetch;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private authHeaders(): Record<string, string> {
    if (!this.apiToken) return {};
    return { Authorization: `Bearer ${this.apiToken}` };
  }

  private async parseJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new RelayClientError(text || res.statusText, res.status);
    }
    return (await res.json()) as T;
  }

  async createSession(input: CreateRelaySessionInput): Promise<RelaySession> {
    const body = {
      javaHost: input.javaHost,
      javaPort: input.javaPort,
      authMode: input.authMode ?? "online",
      reuse: input.reuse ?? true,
    };
    const res = await this.fetchFn(this.url("/v1/sessions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.authHeaders(),
      },
      body: JSON.stringify(body),
    });
    return this.parseJson<RelaySession>(res);
  }

  async getSession(sessionId: string): Promise<RelaySession> {
    const res = await this.fetchFn(this.url(`/v1/sessions/${encodeURIComponent(sessionId)}`), {
      method: "GET",
      headers: { Accept: "application/json", ...this.authHeaders() },
    });
    return this.parseJson<RelaySession>(res);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const res = await this.fetchFn(this.url(`/v1/sessions/${encodeURIComponent(sessionId)}`), {
      method: "DELETE",
      headers: this.authHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      throw new RelayClientError(text || res.statusText, res.status);
    }
  }
}