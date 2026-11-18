import { parseAddress } from "../address";
import {
  buildAddExternalServerUrl,
  buildAddExternalServerUrlFromParsed,
  parseAddExternalServerUrl,
} from "../join";

describe("join URLs", () => {
  it("builds encoded minecraft:// URL for Trix", () => {
    const url = buildAddExternalServerUrl({
      name: "Trix Islands",
      host: "play.trix-islands.gg",
      port: 2788,
      edition: "bedrock",
    });
    expect(url).toBe(
      "minecraft://?addExternalServer=Trix%20Islands%7Cplay.trix-islands.gg%3A2788",
    );
    const parsed = parseAddExternalServerUrl(url);
    expect(parsed).toEqual({
      name: "Trix Islands",
      host: "play.trix-islands.gg",
      port: 2788,
      edition: "bedrock",
    });
  });

  it("wraps IPv6 hosts in brackets", () => {
    const parsed = parseAddress("[2001:db8::1]:19132", "bedrock");
    const url = buildAddExternalServerUrlFromParsed("Local v6", parsed, "bedrock");
    expect(url).toContain("%7C%5B2001%3Adb8%3A%3A1%5D%3A19132");
    const roundTrip = parseAddExternalServerUrl(url);
    expect(roundTrip.host).toBe("2001:db8::1");
    expect(roundTrip.port).toBe(19132);
  });
});