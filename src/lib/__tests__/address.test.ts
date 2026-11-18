import {
  applyStatusAddressHints,
  defaultPort,
  formatHostPort,
  parseAddress,
  userSpecifiedPort,
} from "../address";
import type { ServerStatus } from "../types";
import mcstatusTrix from "./fixtures/mcstatus-trix.json";
import mcsrvstatTrix from "./fixtures/mcsrvstat-trix.json";

describe("parseAddress", () => {
  it("defaults Java port", () => {
    expect(parseAddress("play.trix-islands.gg")).toEqual({
      host: "play.trix-islands.gg",
      port: 25565,
      displayHost: "play.trix-islands.gg",
    });
  });

  it("parses host:port", () => {
    expect(parseAddress("play.trix-islands.gg:2788")).toEqual({
      host: "play.trix-islands.gg",
      port: 2788,
      displayHost: "play.trix-islands.gg",
    });
  });

  it("parses bracketed IPv6 with port", () => {
    expect(parseAddress("[::1]:25565")).toEqual({
      host: "::1",
      port: 25565,
      displayHost: "[::1]",
    });
  });

  it("defaults Bedrock port", () => {
    expect(defaultPort("bedrock")).toBe(19132);
    expect(parseAddress("localhost", "bedrock").port).toBe(19132);
  });

  it("detects explicit port in user input", () => {
    expect(userSpecifiedPort("play.trix-islands.gg")).toBe(false);
    expect(userSpecifiedPort("play.trix-islands.gg:2788")).toBe(true);
    expect(userSpecifiedPort("[::1]:19132")).toBe(true);
  });
});

describe("applyStatusAddressHints (Trix SRV)", () => {
  const parsed = parseAddress("play.trix-islands.gg");

  const mcsrvStatus: ServerStatus = {
    online: mcsrvstatTrix.online,
    host: "play.trix-islands.gg",
    port: mcsrvstatTrix.port,
    resolvedHost: mcsrvstatTrix.hostname,
    srv: mcsrvstatTrix.debug.srv,
    source: "mcsrvstat",
  };

  it("applies SRV port 2788 from mcsrvstat", () => {
    const hinted = applyStatusAddressHints(parsed, mcsrvStatus, "java", false);
    expect(hinted.port).toBe(2788);
    expect(formatHostPort(hinted)).toBe("play.trix-islands.gg:2788");
  });

  it("applies mcstatus.io srv_record port", () => {
    const status: ServerStatus = {
      online: mcstatusTrix.online,
      host: mcstatusTrix.host,
      port: mcstatusTrix.srv_record.port,
      resolvedHost: mcstatusTrix.srv_record.host,
      srv: true,
      source: "mcstatus",
    };
    const hinted = applyStatusAddressHints(parsed, status, "java", false);
    expect(hinted.port).toBe(2788);
  });

  it("keeps user-specified port over SRV", () => {
    const explicit = parseAddress("play.trix-islands.gg:25565");
    const hinted = applyStatusAddressHints(explicit, mcsrvStatus, "java", true);
    expect(hinted.port).toBe(25565);
  });
});