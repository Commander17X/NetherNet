import { RelayClient, RelayClientError } from "../relayClient";

describe("RelayClient", () => {
  const session = {
    id: "sess_abc",
    javaHost: "play.trix-islands.gg",
    javaPort: 2788,
    authMode: "online" as const,
    bedrockHost: "relay.example",
    bedrockPort: 19132,
    publicHost: "relay.example",
    createdAt: "2026-01-01T00:00:00.000Z",
    targetKey: "play.trix-islands.gg:2788:online",
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
      javaHost: "play.trix-islands.gg",
      javaPort: 2788,
    });

    expect(created).toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith("https://relay.example/v1/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        javaHost: "play.trix-islands.gg",
        javaPort: 2788,
        authMode: "online",
        reuse: true,
      }),
    });
  });

  it("sends API token on mutating routes", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => session,
    } satisfies Partial<Response>);

    const client = new RelayClient({
      baseUrl: "https://relay.example",
      apiToken: "secret",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await client.createSession({ javaHost: "h", javaPort: 25565 });
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer secret",
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
      headers: {},
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