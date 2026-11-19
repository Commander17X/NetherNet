import { friendlyError } from "../errors";

describe("friendlyError", () => {
  it("turns browser fetch failures into a plain sentence", () => {
    expect(friendlyError(new TypeError("Failed to fetch"))).toBe("Could not reach the relay.");
    expect(friendlyError(new Error("Network request failed"))).toBe("Could not reach the relay.");
    expect(friendlyError(new Error(""))).toBe("Could not reach the relay.");
  });

  it("keeps a message that already explains the problem", () => {
    expect(friendlyError(new Error("Relay token was missing or wrong."))).toBe("Relay token was missing or wrong.");
  });
});
