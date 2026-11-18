import { defaultPort, formatAddress, parseServerAddress } from "../address";

describe("parseServerAddress", () => {
  it("parses a plain domain and leaves the port open", () => {
    expect(parseServerAddress("  Play.Example.com ")).toEqual({
      ok: true,
      address: { host: "play.example.com", port: null, kind: "domain" },
    });
  });

  it("parses host:port for java and bedrock ports", () => {
    expect(parseServerAddress("play.example.com:25565")).toEqual({
      ok: true,
      address: { host: "play.example.com", port: 25565, kind: "domain" },
    });
    expect(parseServerAddress("geo.hivebedrock.network:19132")).toEqual({
      ok: true,
      address: { host: "geo.hivebedrock.network", port: 19132, kind: "domain" },
    });
  });

  it("parses a custom bedrock port and localhost", () => {
    expect(parseServerAddress("lobby.local:19150").ok && parseServerAddress("lobby.local:19150")).toMatchObject({
      ok: true,
      address: { host: "lobby.local", port: 19150, kind: "domain" },
    });
    expect(parseServerAddress("localhost")).toMatchObject({
      ok: true,
      address: { host: "localhost", port: null, kind: "domain" },
    });
  });

  it("parses ipv4 with and without a port", () => {
    expect(parseServerAddress("192.168.1.20")).toMatchObject({
      ok: true,
      address: { host: "192.168.1.20", port: null, kind: "ipv4" },
    });
    expect(parseServerAddress("10.0.0.8:25565")).toMatchObject({
      ok: true,
      address: { host: "10.0.0.8", port: 25565, kind: "ipv4" },
    });
  });

  it("parses bracketed ipv6 with and without a port", () => {
    expect(parseServerAddress("[::1]")).toEqual({
      ok: true,
      address: { host: "::1", port: null, kind: "ipv6" },
    });
    expect(parseServerAddress("[2001:db8::1]:19132")).toEqual({
      ok: true,
      address: { host: "2001:db8::1", port: 19132, kind: "ipv6" },
    });
    expect(parseServerAddress("[::ffff:192.0.2.1]:25565")).toMatchObject({
      ok: true,
      address: { host: "::ffff:192.0.2.1", port: 25565, kind: "ipv6" },
    });
  });

  it("parses bare ipv6 when no port is given", () => {
    expect(parseServerAddress("2001:db8::10")).toMatchObject({
      ok: true,
      address: { host: "2001:db8::10", port: null, kind: "ipv6" },
    });
  });

  it("strips a pasted scheme", () => {
    expect(parseServerAddress("https://play.example.com:25565/")).toMatchObject({
      ok: true,
      address: { host: "play.example.com", port: 25565, kind: "domain" },
    });
  });

  it("rejects empty, broken ports, and unbracketed ipv6 ports", () => {
    expect(parseServerAddress("   ").ok).toBe(false);
    expect(parseServerAddress("play.example.com:").ok).toBe(false);
    expect(parseServerAddress("play.example.com:0").ok).toBe(false);
    expect(parseServerAddress("play.example.com:65536").ok).toBe(false);
    expect(parseServerAddress("play.example.com:abc").ok).toBe(false);
    expect(parseServerAddress("[::1]:").ok).toBe(false);
    expect(parseServerAddress("[::1").ok).toBe(false);
    expect(parseServerAddress("::1:19132").ok).toBe(false);
    expect(parseServerAddress("not a host").ok).toBe(false);
  });

  it("formats ipv6 with brackets", () => {
    expect(formatAddress("::1", 19132)).toBe("[::1]:19132");
    expect(formatAddress("play.example.com", 25565)).toBe("play.example.com:25565");
    expect(defaultPort("java")).toBe(25565);
    expect(defaultPort("bedrock")).toBe(19132);
  });
});
