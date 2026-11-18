import { RelayClient, RelayClientError } from "../relayClient";

describe("RelayClient", () => {
  const session = {
    id: "sess_abc",
    serverHost: "play.trix-islands.gg",
    serverPort: 2788,
    edition: "java" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-01T01:00:00.000Z",
    joinToken: "token",
  };

  it("POST /v1/sessions", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => session,
    } satisfies Partial<Response>);

    const client = new RelayClient({
      baseUrl: "https://relay.example",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const created = await client.createSession({
      serverHost: "play.trix-islands.gg",
      serverPort: 2788,
    });

    expect(created).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith("https://relay.example/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        serverHost: "play.trix-islands.gg",
        serverPort: 2788,
        edition: "java",
      }),
    });
  });

  it("GET /v1/sessions/:id", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => session,
    } satisfies Partial<Response>);

    const client = new RelayClient({
      baseUrl: "https://relay.example/",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.getSession("sess_abc");
    expect(fetchMock).toHaveBeenCalledWith("https://relay.example/v1/sessions/sess_abc", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  });

  it("DELETE /v1/sessions/:id", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 204 } satisfies Partial<Response>);
    const client = new RelayClient({
      baseUrl: "https://relay.example",
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.deleteSession("sess_abc");
    expect(fetchMock).toHaveBeenCalledWith("https://relay.example/v1/sessions/sess_abc", {
      method: "DELETE",
    });
  });

  it("surfaces HTTP errors", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "missing",
    } satisfies Partial<Response>);

    const client = new RelayClient({
      baseUrl: "https://relay.example",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(client.getSession("missing")).rejects.toBeInstanceOf(RelayClientError);
  });
});