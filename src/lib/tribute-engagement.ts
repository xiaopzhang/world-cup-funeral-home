import type { Tribute } from "./types";

export type TributeVoteType = "like" | "dislike";
export type TributeSortMode = "hot" | "newest";

export function tributeScore(tribute: Pick<Tribute, "likeCount" | "dislikeCount">) {
  return tribute.likeCount - tribute.dislikeCount;
}

export function applyTributeVote({
  currentLikeCount,
  currentDislikeCount,
  previousVoteType,
  nextVoteType,
}: {
  currentLikeCount: number;
  currentDislikeCount: number;
  previousVoteType: TributeVoteType | null;
  nextVoteType: TributeVoteType;
}) {
  if (previousVoteType === nextVoteType) {
    return {
      likeCount: currentLikeCount,
      dislikeCount: currentDislikeCount,
      changed: false,
    };
  }

  let likeCount = currentLikeCount;
  let dislikeCount = currentDislikeCount;

  if (previousVoteType === "like") likeCount = Math.max(0, likeCount - 1);
  if (previousVoteType === "dislike") dislikeCount = Math.max(0, dislikeCount - 1);
  if (nextVoteType === "like") likeCount += 1;
  if (nextVoteType === "dislike") dislikeCount += 1;

  return { likeCount, dislikeCount, changed: true };
}

export function sortTributesForDisplay<T extends Tribute>(
  tributes: T[],
  mode: TributeSortMode,
) {
  return [...tributes].sort((a, b) => {
    const recency = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (mode === "newest") return recency;

    const scoreDiff = tributeScore(b) - tributeScore(a);
    return scoreDiff || recency;
  });
}

function normalizeDuplicateText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isDuplicateTributeSubmission({
  existingText,
  existingAuthor,
  existingCreatedAt,
  nextText,
  nextAuthor,
  now,
  windowMs,
}: {
  existingText: string;
  existingAuthor: string;
  existingCreatedAt: string;
  nextText: string;
  nextAuthor: string;
  now: Date;
  windowMs: number;
}) {
  const isSameText =
    normalizeDuplicateText(existingText) === normalizeDuplicateText(nextText);
  const isSameAuthor =
    normalizeDuplicateText(existingAuthor || "Anonymous Fan") ===
    normalizeDuplicateText(nextAuthor || "Anonymous Fan");
  const ageMs = now.getTime() - new Date(existingCreatedAt).getTime();

  return isSameText && isSameAuthor && ageMs >= 0 && ageMs <= windowMs;
}
