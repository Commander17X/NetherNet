import { motdPlain, parseMotd } from "../motd";

describe("parseMotd", () => {
  it("reads legacy color and format codes", () => {
    const lines = parseMotd("§6§lTRIX-ISLANDS.GG §8| §fLobby §7· §eBoxPvP §7· §dParty §7· §aCreators§r");
    const spans = lines[0] ?? [];
    expect(motdPlain(lines)).toBe("TRIX-ISLANDS.GG | Lobby · BoxPvP · Party · Creators");
    expect(spans[0]).toMatchObject({ text: "TRIX-ISLANDS.GG ", color: "#FFAA00", bold: true });
    expect(spans[1]).toMatchObject({ text: "| ", color: "#555555", bold: true });
    expect(spans.find((span) => span.text.startsWith("BoxPvP"))).toMatchObject({ color: "#FFFF55", bold: true });
    expect(spans.find((span) => span.text.startsWith("Party"))).toMatchObject({ color: "#FF55FF", bold: true });
    expect(spans.find((span) => span.text.startsWith("Creators"))).toMatchObject({ color: "#55FF55", bold: true });
  });

  it("resets formatting and keeps later colors", () => {
    const lines = parseMotd("§l§cBold §rplain §bAqua");
    const spans = lines[0] ?? [];
    expect(spans[0]).toMatchObject({ text: "Bold ", bold: true, color: "#FF5555" });
    expect(spans[1]).toMatchObject({ text: "plain ", bold: false, color: "#FFFFFF" });
    expect(spans[2]).toMatchObject({ text: "Aqua", color: "#55FFFF", bold: false });
  });

  it("accepts ampersand codes and hex colors", () => {
    const ampersand = parseMotd("&aHello &lworld");
    expect(ampersand[0]?.[0]).toMatchObject({ text: "Hello ", color: "#55FF55" });
    expect(ampersand[0]?.[1]).toMatchObject({ text: "world", bold: true, color: "#55FF55" });

    const hex = parseMotd("&#FFAA00Gold");
    expect(hex[0]?.[0]).toMatchObject({ text: "Gold", color: "#FFAA00" });

    const bedrockHex = parseMotd("§x§F§F§5§5§F§FParty");
    expect(bedrockHex[0]?.[0]).toMatchObject({ text: "Party", color: "#FF55FF" });
  });

  it("splits lines from section text and from string arrays", () => {
    expect(motdPlain(parseMotd("Line one\n§bLine two"))).toBe("Line one\nLine two");
    expect(motdPlain(parseMotd(["Alpha", "§cBeta"]))).toBe("Alpha\nBeta");
  });

  it("parses JSON chat components, extras, and hex colors", () => {
    const lines = parseMotd({
      text: "",
      extra: [
        { text: "Hello ", color: "gold", bold: true },
        { text: "world", color: "#55FFFF", italic: true },
        { text: "\n" },
        { text: "again", color: "green", underlined: true },
      ],
    });
    expect(lines[0]?.[0]).toMatchObject({ text: "Hello ", color: "#FFAA00", bold: true });
    expect(lines[0]?.[1]).toMatchObject({ text: "world", color: "#55FFFF", italic: true, bold: false });
    expect(lines[1]?.[0]).toMatchObject({ text: "again", color: "#55FF55", underlined: true, bold: false });
  });

  it("parses a JSON chat string the way some status APIs return it", () => {
    const raw = JSON.stringify({
      text: "",
      extra: [
        { text: "Hello ", color: "gold", bold: true },
        { text: "world", color: "aqua" },
      ],
    });
    const lines = parseMotd(raw);
    expect(motdPlain(lines)).toBe("Hello world");
    expect(lines[0]?.[0]).toMatchObject({ color: "#FFAA00", bold: true });
    expect(lines[0]?.[1]).toMatchObject({ text: "world", color: "#55FFFF" });
  });

  it("fills translate placeholders and skips internal keys", () => {
    const lines = parseMotd({
      translate: "Welcome %s",
      with: [{ text: "Steve", color: "yellow" }],
    });
    expect(motdPlain(lines)).toBe("Welcome Steve");
    expect(lines[0]?.[1]).toMatchObject({ text: "Steve", color: "#FFFF55" });

    const hidden = parseMotd({ translate: "chat.type.text", with: [{ text: "hi" }] });
    expect(motdPlain(hidden)).toBe("hi");
  });

  it("marks obfuscated spans and ignores empty input", () => {
    expect(parseMotd("§kSecret")[0]?.[0]).toMatchObject({ text: "Secret", obfuscated: true });
    expect(parseMotd("")).toEqual([]);
    expect(parseMotd(null)).toEqual([]);
  });
});
