import { parseJsonMotd, parseLegacyMotd, parseMotd } from "../motd";
import mcsrvstatTrix from "./fixtures/mcsrvstat-trix.json";

const trixRaw = mcsrvstatTrix.motd.raw[0] ?? "";

describe("parseLegacyMotd", () => {
  it("parses Trix MOTD plain text", () => {
    const motd = parseLegacyMotd(trixRaw);
    expect(motd.plain).toBe("TRIX-ISLANDS.GG | Lobby · BoxPvP · Party · Creators");
  });

  it("assigns legacy colors as hex", () => {
    const motd = parseLegacyMotd(trixRaw);
    const title = motd.segments.find((s) => s.text.includes("TRIX-ISLANDS.GG"));
    expect(title?.color).toBe("#ffaa00");
    expect(title?.bold).toBe(true);
  });

  it("parses JSON chat components", () => {
    const motd = parseJsonMotd({
      text: "",
      extra: [
        { text: "Hello ", color: "yellow", bold: true },
        { text: "world", color: "#55ff55" },
      ],
    });
    expect(motd.plain).toBe("Hello world");
    expect(motd.segments[0]?.color).toBe("#ffff55");
    expect(motd.segments[1]?.color).toBe("#55ff55");
  });

  it("auto-detects JSON string input", () => {
    const motd = parseMotd('{"text":"NetherNet","color":"aqua"}');
    expect(motd.plain).toBe("NetherNet");
    expect(motd.segments[0]?.color).toBe("#55ffff");
  });
});