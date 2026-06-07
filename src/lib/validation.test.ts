import { describe, expect, it } from "vitest";
import { cleanSignature, validateUserText } from "./validation";

describe("user text validation", () => {
  it("rejects links and harmful football-off-topic content", () => {
    expect(validateUserText("visit https://example.com", 80).ok).toBe(false);
    expect(validateUserText("real world tragedy comparison", 120).ok).toBe(
      false,
    );
  });

  it("enforces field length limits", () => {
    expect(validateUserText("a".repeat(81), 80).ok).toBe(false);
    expect(validateUserText("Penalty heartbreak", 80).ok).toBe(true);
  });

  it("defaults empty signatures to Anonymous Fan", () => {
    expect(cleanSignature("")).toBe("Anonymous Fan");
    expect(cleanSignature("  Udo  ")).toBe("Udo");
    expect(cleanSignature("x".repeat(40))).toHaveLength(30);
  });
});
