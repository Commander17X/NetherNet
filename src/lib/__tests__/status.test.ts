import { clearStatusCache, fetchServerStatus } from "../status";
import mcsrvstatTrix from "./fixtures/mcsrvstat-trix.json";
import mcstatusTrix from "./fixtures/mcstatus-trix.json";

describe("fetchServerStatus", () => {
  beforeEach(() => {
    clearStatusCache();
    jest.useRealTimers();
  });

  it("maps mcsrvstat Trix fixture with SRV port 2788", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mcsrvstatTrix,
      } satisfies Partial<Response>);

    const status = await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
      bypassCache: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mcsrvstat.us/3/play.trix-islands.gg",
    );
    expect(status.online).toBe(true);
    expect(status.port).toBe(2788);
    expect(status.srv).toBe(true);
    expect(status.source).toBe("mcsrvstat");
    expect(status.motd?.plain).toContain("TRIX-ISLANDS.GG");
  });

  it("falls back to mcstatus.io when mcsrvstat fails", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } satisfies Partial<Response>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mcstatusTrix,
      } satisfies Partial<Response>);

    const status = await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
      bypassCache: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.mcstatus.io/v2/status/java/play.trix-islands.gg",
    );
    expect(status.source).toBe("mcstatus");
    expect(status.port).toBe(2788);
    expect(status.resolvedHost).toBe("play.trix-islands.gg");
  });

  it("caches results for ~60s", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mcsrvstatTrix,
    } satisfies Partial<Response>);

    await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
    });
    const cached = await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached.fromCache).toBe(true);

    jest.advanceTimersByTime(59_000);
    await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2_000);
    await fetchServerStatus("play.trix-islands.gg", {
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});