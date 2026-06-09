import { describe, expect, it } from "vitest";
import { filterGeneratedLines, validateGeneratedLine } from "./content-safety";

describe("content safety", () => {
  it("accepts football-focused original copy", () => {
    expect(
      validateGeneratedLine({
        kind: "cause",
        text: "Brazil football hope lost a fight with the scoreboard",
        existing: [],
      }),
    ).toEqual({ ok: true });
  });

  it("rejects links, unsafe language, real-person attacks, overlong lines, and duplicates", () => {
    expect(
      validateGeneratedLine({
        kind: "cause",
        text: "Read more at https://example.com",
        existing: [],
      }).ok,
    ).toBe(false);
    expect(
      validateGeneratedLine({
        kind: "cause",
        text: "The tournament became a nazi joke",
        existing: [],
      }).ok,
    ).toBe(false);
    expect(
      validateGeneratedLine({
        kind: "cause",
        text: "Messi was a trash football clown",
        existing: [],
      }).ok,
    ).toBe(false);
    expect(
      validateGeneratedLine({
        kind: "cause",
        text: "Football ".repeat(20),
        existing: [],
      }).ok,
    ).toBe(false);
    expect(
      validateGeneratedLine({
        kind: "epitaph",
        text: "Here lies hope, betrayed by the scoreboard.",
        existing: ["Here lies hope betrayed by the scoreboard"],
      }).ok,
    ).toBe(false);
  });

  it("rejects a whole batch when any generated line is unsafe", () => {
    const filtered = filterGeneratedLines({
      causes: ["Brazil football hope lost a fight with the scoreboard", "www.bad.test"],
      epitaphs: ["Here lies Brazil football hope, mugged by the final whistle."],
      existingCauses: [],
      existingEpitaphs: [],
    });

    expect(filtered.causes).toHaveLength(1);
    expect(filtered.rejected).toHaveLength(1);
  });
});
