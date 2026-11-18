import type { CreateRelaySessionInput, Edition, RelaySession } from "./types";

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
  fetch?: FetchLike;
}

export class RelayClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;

  constructor(options: RelayClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.fetchFn = options.fetch ?? fetch;
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
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
      serverHost: input.serverHost,
      serverPort: input.serverPort,
      edition: (input.edition ?? "java") satisfies Edition,
    };
    const res = await this.fetchFn(this.url("/v1/sessions"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    return this.parseJson<RelaySession>(res);
  }

  async getSession(sessionId: string): Promise<RelaySession> {
    const res = await this.fetchFn(this.url(`/v1/sessions/${encodeURIComponent(sessionId)}`), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    return this.parseJson<RelaySession>(res);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const res = await this.fetchFn(this.url(`/v1/sessions/${encodeURIComponent(sessionId)}`), {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => "");
      throw new RelayClientError(text || res.statusText, res.status);
    }
  }
}