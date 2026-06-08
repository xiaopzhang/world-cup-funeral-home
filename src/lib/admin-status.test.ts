import { describe, expect, it } from "vitest";
import { normalizeManualTeamStatusUpdate } from "./admin-status";

describe("normalizeManualTeamStatusUpdate", () => {
  it("turns eliminated teams playable and keeps a manual audit reason", () => {
    const update = normalizeManualTeamStatusUpdate({
      status: "eliminated",
      isPlayable: "on",
      eliminatedAt: "2026-07-05",
      deathMatchId: "match_manual_brazil_2026",
      reason: "Correcting provider result",
    });

    expect(update).toEqual({
      status: "eliminated",
      isPlayable: true,
      eliminatedAt: "2026-07-05",
      deathMatchId: "match_manual_brazil_2026",
      reason: "Correcting provider result",
    });
  });

  it("locks alive teams and clears elimination metadata by default", () => {
    const update = normalizeManualTeamStatusUpdate({
      status: "alive",
      isPlayable: "",
      eliminatedAt: "2026-07-05",
      deathMatchId: "match_manual_brazil_2026",
      reason: "",
    });

    expect(update).toMatchObject({
      status: "alive",
      isPlayable: false,
      eliminatedAt: null,
      deathMatchId: null,
      reason: "Manual admin status update.",
    });
  });

  it("rejects unknown statuses", () => {
    expect(() =>
      normalizeManualTeamStatusUpdate({
        status: "sleeping",
        isPlayable: "on",
        eliminatedAt: "",
        deathMatchId: "",
        reason: "",
      }),
    ).toThrow("Unknown team status");
  });
});
