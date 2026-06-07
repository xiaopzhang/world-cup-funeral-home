import crypto from "node:crypto";
import type { Team, TeamStatus } from "./types";

export type ProviderName = "football-data" | "worldcupjson";

export type NormalizedMatchEvent = {
  providerMatchId: string;
  provider: ProviderName;
  stage: string;
  date: string;
  status: "final";
  homeName: string;
  awayName: string;
  winnerName: string;
  loserName: string;
  homeScore: number | null;
  awayScore: number | null;
  penaltyScore: string | null;
  rawHash: string;
};

export type TeamStatusUpdate = {
  slug: string;
  status: TeamStatus;
  isPlayable: boolean;
  eliminatedAt: string;
  deathMatchId: string;
};

export type TeamStatusEvent = {
  teamSlug: string;
  providerMatchId: string;
  fromStatus: TeamStatus;
  toStatus: TeamStatus;
  reason: string;
  source: ProviderName;
};

type FootballDataMatch = {
  id?: number | string;
  utcDate?: string;
  stage?: string;
  status?: string;
  homeTeam?: { id?: number | string; name?: string; shortName?: string };
  awayTeam?: { id?: number | string; name?: string; shortName?: string };
  score?: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime?: { home?: number | null; away?: number | null };
    penalties?: { home?: number | null; away?: number | null };
  };
};

const knockoutStages = new Set([
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
]);

function stableHash(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function slugifyTeamName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function shouldRunCron(
  secret: string | undefined,
  authorization: string | null,
  querySecret?: string | null,
) {
  if (!secret) {
    return false;
  }

  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : querySecret;
  if (!provided) {
    return false;
  }

  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export function normalizeFootballDataMatch(
  match: FootballDataMatch,
): NormalizedMatchEvent | null {
  if (!match.id || match.status !== "FINISHED" || !match.score?.winner) {
    return null;
  }

  if (!match.stage || !knockoutStages.has(match.stage)) {
    return null;
  }

  const homeName = match.homeTeam?.name;
  const awayName = match.awayTeam?.name;
  if (!homeName || !awayName) {
    return null;
  }

  const winnerName =
    match.score.winner === "HOME_TEAM"
      ? homeName
      : match.score.winner === "AWAY_TEAM"
        ? awayName
        : null;

  if (!winnerName) {
    return null;
  }

  const loserName = winnerName === homeName ? awayName : homeName;
  const penalties = match.score.penalties;
  const penaltyScore =
    penalties?.home != null && penalties.away != null
      ? `${penalties.home}-${penalties.away} on penalties`
      : null;

  return {
    providerMatchId: `football-data:${match.id}`,
    provider: "football-data",
    stage: match.stage,
    date: (match.utcDate ?? new Date().toISOString()).slice(0, 10),
    status: "final",
    homeName,
    awayName,
    winnerName,
    loserName,
    homeScore: match.score.fullTime?.home ?? null,
    awayScore: match.score.fullTime?.away ?? null,
    penaltyScore,
    rawHash: stableHash(match),
  };
}

export function applyWorldCupMatchEvents({
  teams,
  existingProviderMatchIds,
  events,
}: {
  teams: Team[];
  existingProviderMatchIds: Set<string>;
  events: NormalizedMatchEvent[];
}) {
  const teamBySlug = new Map(teams.map((team) => [team.slug, team]));
  const teamUpdates: TeamStatusUpdate[] = [];
  const statusEvents: TeamStatusEvent[] = [];
  const skipped: string[] = [];

  for (const event of events) {
    if (existingProviderMatchIds.has(event.providerMatchId)) {
      skipped.push(`${event.providerMatchId}: already processed`);
      continue;
    }

    const loserSlug = slugifyTeamName(event.loserName);
    const loser = teamBySlug.get(loserSlug);
    if (!loser) {
      skipped.push(`${event.providerMatchId}: unknown loser ${event.loserName}`);
      continue;
    }

    if (loser.status === "eliminated" || loser.status === "champion") {
      skipped.push(`${event.providerMatchId}: ${loser.name} already ${loser.status}`);
      continue;
    }

    const deathMatchId = `match_${event.providerMatchId.replace(/[^a-z0-9]+/gi, "_")}`;
    teamUpdates.push({
      slug: loser.slug,
      status: "eliminated",
      isPlayable: true,
      eliminatedAt: event.date,
      deathMatchId,
    });
    statusEvents.push({
      teamSlug: loser.slug,
      providerMatchId: event.providerMatchId,
      fromStatus: loser.status,
      toStatus: "eliminated",
      source: event.provider,
      reason: `${loser.name} were eliminated by ${event.winnerName} in ${event.stage}.`,
    });
  }

  return { teamUpdates, statusEvents, skipped };
}

export async function fetchFootballDataWorldCupMatches(token: string) {
  const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": token },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`football-data.org returned ${response.status}`);
  }

  const payload = (await response.json()) as { matches?: FootballDataMatch[] };
  return (payload.matches ?? []).map(normalizeFootballDataMatch).filter(Boolean);
}
