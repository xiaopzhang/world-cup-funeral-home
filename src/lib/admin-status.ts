import type { TeamStatus } from "./types";

const allowedStatuses: TeamStatus[] = [
  "alive",
  "eliminated",
  "early_admission",
  "champion",
  "pending",
];

export type ManualStatusInput = {
  status: string;
  isPlayable?: string | boolean | null;
  eliminatedAt?: string | null;
  deathMatchId?: string | null;
  reason?: string | null;
};

export type ManualStatusUpdate = {
  status: TeamStatus;
  isPlayable: boolean;
  eliminatedAt: string | null;
  deathMatchId: string | null;
  reason: string;
};

export function normalizeManualTeamStatusUpdate(
  input: ManualStatusInput,
): ManualStatusUpdate {
  if (!allowedStatuses.includes(input.status as TeamStatus)) {
    throw new Error("Unknown team status.");
  }

  const status = input.status as TeamStatus;
  const canBePlayable = status === "eliminated" || status === "early_admission";
  const isPlayable = canBePlayable && (input.isPlayable === true || input.isPlayable === "on");
  const eliminatedAt =
    status === "alive" || status === "pending"
      ? null
      : input.eliminatedAt?.trim() || new Date().toISOString().slice(0, 10);
  const deathMatchId =
    status === "alive" || status === "pending"
      ? null
      : input.deathMatchId?.trim() || null;

  return {
    status,
    isPlayable,
    eliminatedAt,
    deathMatchId,
    reason: input.reason?.trim() || "Manual admin status update.",
  };
}
