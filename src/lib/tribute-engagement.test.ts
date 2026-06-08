import { describe, expect, it } from "vitest";
import {
  applyTributeVote,
  isDuplicateTributeSubmission,
  sortTributesForDisplay,
} from "./tribute-engagement";
import type { Tribute } from "./types";

const tribute = (
  id: string,
  createdAt: string,
  likeCount: number,
  dislikeCount: number,
): Tribute => ({
  id,
  tombstoneId: "ts_1",
  teamSlug: "italy",
  tributeText: `Tribute ${id}`,
  authorName: "Fan",
  createdAt,
  moderationStatus: "approved",
  reportCount: 0,
  likeCount,
  dislikeCount,
});

describe("tribute engagement", () => {
  it("adds a first like vote", () => {
    expect(
      applyTributeVote({
        currentLikeCount: 0,
        currentDislikeCount: 0,
        previousVoteType: null,
        nextVoteType: "like",
      }),
    ).toEqual({ likeCount: 1, dislikeCount: 0, changed: true });
  });

  it("switches a like vote to a dislike vote", () => {
    expect(
      applyTributeVote({
        currentLikeCount: 1,
        currentDislikeCount: 0,
        previousVoteType: "like",
        nextVoteType: "dislike",
      }),
    ).toEqual({ likeCount: 0, dislikeCount: 1, changed: true });
  });

  it("does not double count repeated votes", () => {
    expect(
      applyTributeVote({
        currentLikeCount: 1,
        currentDislikeCount: 0,
        previousVoteType: "like",
        nextVoteType: "like",
      }),
    ).toEqual({ likeCount: 1, dislikeCount: 0, changed: false });
  });

  it("sorts hot tributes by score and then recency", () => {
    const sorted = sortTributesForDisplay(
      [
        tribute("older-high", "2026-06-08T10:00:00Z", 5, 1),
        tribute("newer-high", "2026-06-08T11:00:00Z", 6, 2),
        tribute("low", "2026-06-08T12:00:00Z", 2, 0),
      ],
      "hot",
    );

    expect(sorted.map((item) => item.id)).toEqual([
      "newer-high",
      "older-high",
      "low",
    ]);
  });

  it("sorts newest tributes by creation time", () => {
    const sorted = sortTributesForDisplay(
      [
        tribute("old", "2026-06-08T10:00:00Z", 10, 0),
        tribute("new", "2026-06-08T12:00:00Z", 0, 0),
      ],
      "newest",
    );

    expect(sorted.map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("detects duplicate tribute submissions in a short window", () => {
    expect(
      isDuplicateTributeSubmission({
        existingText: "Same pain",
        existingAuthor: "Fan",
        existingCreatedAt: "2026-06-08T10:00:20Z",
        nextText: "  Same pain  ",
        nextAuthor: "Fan",
        now: new Date("2026-06-08T10:00:40Z"),
        windowMs: 60_000,
      }),
    ).toBe(true);
  });
});
