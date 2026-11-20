import { bareHost, buildMinecraftAddServerUrl, buildMinecraftConnectUrl } from "../joinUrl";

describe("connect url", () => {
  it("joins a domain on a custom port", () => {
    expect(buildMinecraftConnectUrl("play.trix-islands.gg", 2788)).toBe(
      "minecraft://connect/?serverUrl=play.trix-islands.gg&serverPort=2788",
    );
  });

  it("joins a relay session by ip and port", () => {
    expect(buildMinecraftConnectUrl("151.243.241.246", 19140)).toBe(
      "minecraft://connect/?serverUrl=151.243.241.246&serverPort=19140",
    );
  });

  it("drops schemes, paths and stray dots from the host", () => {
    expect(buildMinecraftConnectUrl("https://play.example.com/", 19132)).toBe(
      "minecraft://connect/?serverUrl=play.example.com&serverPort=19132",
    );
    expect(bareHost("mc.example.net.")).toBe("mc.example.net");
    expect(bareHost("[::1]")).toBe("::1");
  });

  it("falls back to the bedrock default for a bad port", () => {
    expect(buildMinecraftConnectUrl("10.0.0.2", 0)).toBe("minecraft://connect/?serverUrl=10.0.0.2&serverPort=19132");
  });
});

describe("add server url", () => {
  it("builds an external-server link and brackets ipv6", () => {
    expect(buildMinecraftAddServerUrl("Trix Islands", "play.trix-islands.gg", 2788)).toBe(
      "minecraft://?addExternalServer=Trix%20Islands|play.trix-islands.gg:2788",
    );
    expect(buildMinecraftAddServerUrl("Lan", "::1", 19132)).toBe("minecraft://?addExternalServer=Lan|[::1]:19132");
    expect(buildMinecraftAddServerUrl("Bad|Name", "10.0.0.2", 19150)).toBe(
      "minecraft://?addExternalServer=Bad%20Name|10.0.0.2:19150",
    );
  });
});
