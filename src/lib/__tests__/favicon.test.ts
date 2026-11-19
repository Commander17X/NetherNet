import { parseFavicon } from "../favicon";

const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("parseFavicon", () => {
  it("accepts a png data uri and normalizes it", () => {
    expect(parseFavicon(`data:image/png;base64,${TINY_PNG}`)).toBe(`data:image/png;base64,${TINY_PNG}`);
    expect(parseFavicon(`  DATA:IMAGE/PNG;BASE64,${TINY_PNG}  `)).toBe(`data:image/png;base64,${TINY_PNG}`);
  });

  it("accepts raw base64 and base64 with whitespace", () => {
    const spaced = TINY_PNG.replace("iVBOR", "iVBOR\n");
    expect(parseFavicon(TINY_PNG)).toBe(`data:image/png;base64,${TINY_PNG}`);
    expect(parseFavicon(`data:image/png;base64,${spaced}`)).toBe(`data:image/png;base64,${TINY_PNG}`);
  });

  it("rejects missing, non-png, and invalid payloads", () => {
    expect(parseFavicon(null)).toBeNull();
    expect(parseFavicon("")).toBeNull();
    expect(parseFavicon("not an image")).toBeNull();
    expect(parseFavicon("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBeNull();
    expect(parseFavicon(`data:image/png;base64,${"A".repeat(80)}`)).toBeNull();
    expect(parseFavicon("data:image/png;base64,@@@")).toBeNull();
    expect(parseFavicon(`data:text/plain;base64,${TINY_PNG}`)).toBeNull();
  });
});
