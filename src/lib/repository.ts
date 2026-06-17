import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  createTombstoneRecord as createDemoTombstoneRecord,
  getActivityFeed as getDemoActivityFeed,
  getHomeSnapshot as getDemoHomeSnapshot,
  getTeamsWithCounts as getDemoTeamsWithCounts,
  getTombstoneDetails as getDemoTombstoneDetails,
  interactWithTombstone as interactWithDemoTombstone,
  leaveTribute as leaveDemoTribute,
} from "./demo-store";
import {
  getTeamContentPack,
  italyDeathMatch,
  matches as seededMatches,
  teamContentPacks,
  teams as seededTeams,
} from "./seed-data";
import { filterGeneratedLines } from "./content-safety";
import { generateDeepSeekMemeContent } from "./deepseek";
import {
  applyWorldCupMatchEvents,
  fetchFootballDataWorldCupMatches,
  type NormalizedMatchEvent,
} from "./world-cup-sync";
import {
  normalizeManualTeamStatusUpdate,
  type ManualStatusInput,
} from "./admin-status";
import {
  applyTributeVote,
  isDuplicateTributeSubmission,
  type TributeVoteType,
} from "./tribute-engagement";
import { cleanSignature, validateRequiredSignature, validateUserText } from "./validation";
import type {
  ActivityItem,
  InteractionType,
  Match,
  Team,
  TeamContentPack,
  Tombstone,
  TombstoneDetails,
  Tribute,
} from "./types";

type CreateInput = {
  teamSlug: string;
  causeOfDeath: string;
  epitaph: string;
  buriedBy: string;
};

type ReportInput = {
  targetType: "tombstone" | "tribute";
  targetId: string;
  reason: string;
};

type AdminReportAction = "dismiss" | "hide_content";

const rateLimitConfig = {
  create_tombstone: { limit: 8, windowMs: 60 * 60 * 1000 },
  ritual: { limit: 120, windowMs: 60 * 60 * 1000 },
  tribute: { limit: 20, windowMs: 60 * 60 * 1000 },
  tribute_vote: { limit: 240, windowMs: 60 * 60 * 1000 },
  report: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

type DbTeam = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  flag_url: string;
  status: Team["status"];
  admission_type: Team["admissionType"];
  is_playable: boolean;
  eliminated_at: string | null;
  death_match_id: string | null;
};

type DbMatch = {
  id: string;
  stage: string;
  date: string | null;
  venue: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
  team_a_score: number | null;
  team_b_score: number | null;
  extra_time: boolean;
  penalty_score: string | null;
  winner_team_id: string | null;
  loser_team_id: string | null;
  status: "final";
  source: string;
  display_text?: string | null;
  broadcast_text?: string | null;
};

type DbTombstone = {
  id: string;
  team_id: string;
  death_match_id: string;
  cause_of_death: string;
  epitaph: string;
  buried_by: string;
  created_at: string;
  share_slug: string;
  flower_count: number;
  candle_count: number;
  incense_count: number;
  tribute_count: number;
  is_public: boolean;
  moderation_status: Tombstone["moderationStatus"];
};

type DbTribute = {
  id: string;
  tombstone_id: string;
  team_id: string;
  tribute_text: string;
  author_name: string;
  created_at: string;
  moderation_status: Tribute["moderationStatus"];
  report_count: number;
  like_count?: number;
  dislike_count?: number;
  subject_hash?: string | null;
};

type DbActivity = {
  id: string;
  activity_type: ActivityItem["activityType"];
  team_id: string;
  tombstone_id: string | null;
  tribute_id: string | null;
  interaction_type: InteractionType | null;
  display_text: string;
  created_at: string;
};

type DbTributeVote = {
  id: string;
  tribute_id: string;
  vote_type: TributeVoteType;
  subject_hash: string;
};

type DbCause = {
  id: string;
  team_id: string | null;
  cause_text: string;
  category: string;
  is_team_specific: boolean;
  is_user_generated?: boolean;
  is_active?: boolean;
};

type DbEpitaph = {
  id: string;
  team_id: string | null;
  epitaph_text: string;
  tone: string | null;
  is_team_specific: boolean;
  is_user_generated?: boolean;
  is_active?: boolean;
};

let serverClient: SupabaseClient | null = null;

function hasServerSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function getServerClient() {
  if (!hasServerSupabaseConfig()) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  return serverClient;
}

const now = () => new Date().toISOString();

function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function makeTombstoneShareSlug(teamSlug: string) {
  return `${teamSlug}-tombstone-${Math.random().toString(36).slice(2, 7)}`;
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  const message = maybeError.message ?? "";
  return message.includes(columnName) && (
    maybeError.code === "42703" ||
    message.includes("Could not find") ||
    message.includes("schema cache")
  );
}

function hashSubject(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  const userAgent = request.headers.get("user-agent") ?? "unknown-agent";
  return crypto
    .createHash("sha256")
    .update(`${forwardedFor ?? realIp ?? "unknown-ip"}|${userAgent}`)
    .digest("hex");
}

export function subjectHashForRequest(request: Request) {
  return hashSubject(request);
}

export async function enforceRateLimit(
  action: keyof typeof rateLimitConfig,
  request: Request,
) {
  const client = getServerClient();
  if (!client) return;

  const config = rateLimitConfig[action];
  const windowStart = new Date(
    Math.floor(Date.now() / config.windowMs) * config.windowMs,
  ).toISOString();
  const subjectHash = hashSubject(request);
  const id = `rl_${crypto
    .createHash("sha256")
    .update(`${action}|${subjectHash}|${windowStart}`)
    .digest("hex")
    .slice(0, 28)}`;

  const { data: existing, error: existingError } = await client
    .from("rate_limits")
    .select("count")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;

  const count = ((existing as { count: number } | null)?.count ?? 0) + 1;
  if (count > config.limit) {
    throw new Error("Too many requests. Please let the candles breathe for a moment.");
  }

  const { error } = await client.from("rate_limits").upsert({
    id,
    action,
    subject_hash: subjectHash,
    window_start: windowStart,
    count,
    updated_at: now(),
  });
  if (error) throw error;
}

function teamFromDb(row: DbTeam, counts?: Partial<Team>): Team {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    countryCode: row.country_code,
    flagUrl: row.flag_url,
    status: row.status,
    admissionType: row.admission_type,
    isPlayable: row.is_playable,
    eliminatedAt: row.eliminated_at,
    deathMatchId: row.death_match_id,
    tombstoneCount: counts?.tombstoneCount ?? 0,
    flowerCount: counts?.flowerCount ?? 0,
    candleCount: counts?.candleCount ?? 0,
    incenseCount: counts?.incenseCount ?? 0,
    tributeCount: counts?.tributeCount ?? 0,
  };
}

function tombstoneFromDb(row: DbTombstone, teamsById: Map<string, Team>): Tombstone {
  const team = teamsById.get(row.team_id);
  return {
    id: row.id,
    teamSlug: team?.slug ?? row.team_id.replace(/^team_/, ""),
    deathMatchId: row.death_match_id,
    causeOfDeath: row.cause_of_death,
    epitaph: row.epitaph,
    buriedBy: row.buried_by,
    createdAt: row.created_at,
    shareSlug: row.share_slug,
    flowerCount: row.flower_count,
    candleCount: row.candle_count,
    incenseCount: row.incense_count,
    tributeCount: row.tribute_count,
    isPublic: row.is_public,
    moderationStatus: row.moderation_status,
  };
}

function matchFromDb(row: DbMatch, teamsById: Map<string, Team>): Match {
  const teamA = row.team_a_id ? teamsById.get(row.team_a_id) : null;
  const teamB = row.team_b_id ? teamsById.get(row.team_b_id) : null;
  const winner = row.winner_team_id ? teamsById.get(row.winner_team_id) : null;
  const loser = row.loser_team_id ? teamsById.get(row.loser_team_id) : null;
  const scoreText =
    teamA && teamB && row.team_a_score != null && row.team_b_score != null
      ? `${teamA.name} ${row.team_a_score}-${row.team_b_score} ${teamB.name}`
      : row.stage;

  return {
    id: row.id,
    stage: row.stage,
    date: row.date ?? "",
    venue: row.venue ?? "",
    teamA: teamA?.name ?? "TBD",
    teamB: teamB?.name ?? "TBD",
    teamAScore: row.team_a_score ?? 0,
    teamBScore: row.team_b_score ?? 0,
    extraTime: row.extra_time,
    penaltyScore: row.penalty_score,
    winnerTeamSlug: winner?.slug ?? "",
    loserTeamSlug: loser?.slug ?? "",
    status: row.status,
    source: row.source,
    displayText: row.display_text ?? `Death Match: ${scoreText}. ${row.stage}.`,
    broadcastText:
      row.broadcast_text ??
      (loser ? `${loser.name} has been admitted to the Funeral Home.` : row.source),
  };
}

function contentPackFromDb({
  team,
  genericCauses,
  teamCauses,
  genericEpitaphs,
  teamEpitaphs,
}: {
  team: Team;
  genericCauses: DbCause[];
  teamCauses: DbCause[];
  genericEpitaphs: DbEpitaph[];
  teamEpitaphs: DbEpitaph[];
}): TeamContentPack {
  const fallback = getTeamContentPack(team.slug);
  const causeRows = [
    ...(genericCauses.length
      ? genericCauses.map((row) => ({
          id: row.id,
          text: row.cause_text,
          category: row.is_user_generated ? "generated" as const : "generic" as const,
          isTeamSpecific: row.is_team_specific,
        }))
      : fallback.causes.filter((item) => !item.isTeamSpecific)),
    ...(teamCauses.length
      ? teamCauses.map((row) => ({
          id: row.id,
          text: row.cause_text,
          category: row.is_user_generated ? "generated" as const : "team" as const,
          isTeamSpecific: row.is_team_specific,
        }))
      : fallback.causes.filter((item) => item.isTeamSpecific)),
  ];
  const epitaphRows = [
    ...(genericEpitaphs.length
      ? genericEpitaphs.map((row) => ({
          id: row.id,
          text: row.epitaph_text,
          tone: row.is_user_generated ? "generated" as const : "dark_comedy" as const,
          isTeamSpecific: row.is_team_specific,
        }))
      : fallback.epitaphs.filter((item) => !item.isTeamSpecific)),
    ...(teamEpitaphs.length
      ? teamEpitaphs.map((row) => ({
          id: row.id,
          text: row.epitaph_text,
          tone: row.is_user_generated
            ? "generated" as const
            : row.tone === "fan_pain"
              ? "fan_pain" as const
              : "dark_comedy" as const,
          isTeamSpecific: row.is_team_specific,
        }))
      : fallback.epitaphs.filter((item) => item.isTeamSpecific)),
  ];

  return {
    ...fallback,
    causes: causeRows,
    epitaphs: epitaphRows,
  };
}

function tributeFromDb(row: DbTribute, teamsById: Map<string, Team>): Tribute {
  return {
    id: row.id,
    tombstoneId: row.tombstone_id,
    teamSlug: teamsById.get(row.team_id)?.slug ?? row.team_id.replace(/^team_/, ""),
    tributeText: row.tribute_text,
    authorName: row.author_name,
    createdAt: row.created_at,
    moderationStatus: row.moderation_status,
    reportCount: row.report_count,
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
  };
}

function activityFromDb(row: DbActivity, teamsById: Map<string, Team>): ActivityItem {
  return {
    id: row.id,
    activityType: row.activity_type,
    teamSlug: teamsById.get(row.team_id)?.slug ?? row.team_id.replace(/^team_/, ""),
    tombstoneId: row.tombstone_id,
    tributeId: row.tribute_id,
    interactionType: row.interaction_type,
    displayText: row.display_text,
    createdAt: row.created_at,
  };
}

async function loadTeams(client: SupabaseClient) {
  const { data, error } = await client.from("teams").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as DbTeam[];
}

async function loadTeamsWithCounts(client: SupabaseClient) {
  const teamRows = await loadTeams(client);
  const { data: tombstoneRows, error: tombstoneError } = await client
    .from("tombstones")
    .select("team_id, flower_count, candle_count, incense_count, tribute_count")
    .eq("is_public", true)
    .eq("moderation_status", "approved");
  if (tombstoneError) throw tombstoneError;

  const counts = new Map<string, Partial<Team>>();
  for (const row of (tombstoneRows ?? []) as Pick<
    DbTombstone,
    "team_id" | "flower_count" | "candle_count" | "incense_count" | "tribute_count"
  >[]) {
    const current = counts.get(row.team_id) ?? {
      tombstoneCount: 0,
      flowerCount: 0,
      candleCount: 0,
      incenseCount: 0,
      tributeCount: 0,
    };
    current.tombstoneCount = (current.tombstoneCount ?? 0) + 1;
    current.flowerCount = (current.flowerCount ?? 0) + row.flower_count;
    current.candleCount = (current.candleCount ?? 0) + row.candle_count;
    current.incenseCount = (current.incenseCount ?? 0) + row.incense_count;
    current.tributeCount = (current.tributeCount ?? 0) + row.tribute_count;
    counts.set(row.team_id, current);
  }

  return teamRows.map((row) => teamFromDb(row, counts.get(row.id)));
}

async function addActivity(
  client: SupabaseClient,
  item: Omit<DbActivity, "id" | "created_at">,
) {
  await client.from("activity_feed").insert({
    id: makeId("act"),
    created_at: now(),
    ...item,
  });
}

export async function getTeamsWithCounts(): Promise<Team[]> {
  const client = getServerClient();
  if (!client) return getDemoTeamsWithCounts();
  return loadTeamsWithCounts(client);
}

export async function getHomeSnapshot() {
  const client = getServerClient();
  if (!client) return getDemoHomeSnapshot();

  const teams = await loadTeamsWithCounts(client);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const { data: latestRows, error: latestError } = await client
    .from("tombstones")
    .select("*")
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(6);
  if (latestError) throw latestError;

  const { data: activityRows, error: activityError } = await client
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (activityError) throw activityError;

  return {
    teams,
    latestTombstones: ((latestRows ?? []) as DbTombstone[]).map((row) =>
      tombstoneFromDb(row, teamsById),
    ),
    activity: ((activityRows ?? []) as DbActivity[]).map((row) =>
      activityFromDb(row, teamsById),
    ),
  };
}

export async function getContentOptions(teamSlug: string): Promise<TeamContentPack> {
  const client = getServerClient();
  if (!client) return getTeamContentPack(teamSlug);

  const { data: teamRow, error: teamError } = await client
    .from("teams")
    .select("*")
    .eq("slug", teamSlug)
    .single();
  if (teamError || !teamRow) return getTeamContentPack(teamSlug);
  const team = teamFromDb(teamRow as DbTeam);

  const [genericCauses, teamCauses, genericEpitaphs, teamEpitaphs] = await Promise.all([
    client
      .from("cause_library")
      .select("*")
      .is("team_id", null)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    client
      .from("cause_library")
      .select("*")
      .eq("team_id", team.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    client
      .from("epitaph_library")
      .select("*")
      .is("team_id", null)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
    client
      .from("epitaph_library")
      .select("*")
      .eq("team_id", team.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (genericCauses.error || teamCauses.error || genericEpitaphs.error || teamEpitaphs.error) {
    return getTeamContentPack(teamSlug);
  }

  return contentPackFromDb({
    team,
    genericCauses: (genericCauses.data ?? []) as DbCause[],
    teamCauses: (teamCauses.data ?? []) as DbCause[],
    genericEpitaphs: (genericEpitaphs.data ?? []) as DbEpitaph[],
    teamEpitaphs: (teamEpitaphs.data ?? []) as DbEpitaph[],
  });
}

export async function getShareHooks(teamSlug: string) {
  return (await getContentOptions(teamSlug)).shareHooks;
}

export async function getCreateOptions() {
  const teams = (await getTeamsWithCounts()).filter((team) => team.isPlayable);
  const client = getServerClient();
  const content = Object.fromEntries(
    await Promise.all(teams.map(async (team) => [team.slug, await getContentOptions(team.slug)])),
  );
  if (client) {
    const teamsById = new Map((await loadTeamsWithCounts(client)).map((team) => [team.id, team]));
    const matchIds = teams.map((team) => team.deathMatchId).filter(Boolean) as string[];
    if (matchIds.length) {
      const { data, error } = await client.from("matches").select("*").in("id", matchIds);
      if (error) throw error;
      return {
        teams,
        matches: ((data ?? []) as DbMatch[]).map((row) => matchFromDb(row, teamsById)),
        content,
      };
    }
  }

  return {
    teams,
    matches: seededMatches,
    content,
  };
}

export async function createTombstoneRecord(input: CreateInput): Promise<Tombstone> {
  const client = getServerClient();
  if (!client) return createDemoTombstoneRecord(input);

  const [causeValidation, epitaphValidation, signatureValidation] = [
    validateUserText(input.causeOfDeath, 80),
    validateUserText(input.epitaph, 120),
    validateRequiredSignature(input.buriedBy, 30),
  ];
  for (const result of [causeValidation, epitaphValidation, signatureValidation]) {
    if (!result.ok) throw new Error(result.message);
  }

  const { data: teamRow, error: teamError } = await client
    .from("teams")
    .select("*")
    .eq("slug", input.teamSlug)
    .single();
  if (teamError || !teamRow) throw new Error("This team is not available for burial yet.");
  const team = teamFromDb(teamRow as DbTeam);
  if (!team.isPlayable) throw new Error("This team is not available for burial yet.");

  const tombstoneRow = {
    id: makeId("ts"),
    team_id: team.id,
    death_match_id: team.deathMatchId ?? italyDeathMatch.id,
    cause_of_death: input.causeOfDeath.trim(),
    epitaph: input.epitaph.trim(),
    buried_by: cleanSignature(input.buriedBy),
    share_slug: "",
  };
  tombstoneRow.share_slug = makeTombstoneShareSlug(team.slug);

  let insertResult = await client.from("tombstones").insert(tombstoneRow).select("*").single();
  if (insertResult.error?.code === "23505") {
    tombstoneRow.share_slug = makeTombstoneShareSlug(team.slug);
    insertResult = await client.from("tombstones").insert(tombstoneRow).select("*").single();
  }
  if (insertResult.error || !insertResult.data) {
    throw new Error(insertResult.error?.message ?? "Unable to publish tombstone.");
  }

  await addActivity(client, {
    activity_type: "tombstone_created",
    team_id: team.id,
    tombstone_id: tombstoneRow.id,
    tribute_id: null,
    interaction_type: null,
    display_text: `${tombstoneRow.buried_by} buried ${team.name}. Cause of death: ${tombstoneRow.cause_of_death}.`,
  });

  return tombstoneFromDb(insertResult.data as DbTombstone, new Map([[team.id, team]]));
}

export async function getTombstoneDetails(id: string): Promise<TombstoneDetails | null> {
  const client = getServerClient();
  if (!client) return getDemoTombstoneDetails(id);

  const teams = await loadTeamsWithCounts(client);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const { data: tombstoneRow, error } = await client
    .from("tombstones")
    .select("*")
    .or(`id.eq.${id},share_slug.eq.${id}`)
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .maybeSingle();
  if (error || !tombstoneRow) return null;

  const tombstone = tombstoneFromDb(tombstoneRow as DbTombstone, teamsById);
  const team = teams.find((candidate) => candidate.slug === tombstone.teamSlug);
  if (!team) return null;

  const { data: matchRow } = await client
    .from("matches")
    .select("*")
    .eq("id", tombstone.deathMatchId)
    .maybeSingle();
  const deathMatch = matchRow
    ? matchFromDb(matchRow as DbMatch, teamsById)
    : seededMatches.find((match) => match.id === tombstone.deathMatchId);
  if (!deathMatch) return null;

  const { data: tributeRows, error: tributeError } = await client
    .from("tributes")
    .select("*")
    .eq("tombstone_id", tombstone.id)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);
  if (tributeError) throw tributeError;

  const { data: activityRows, error: activityError } = await client
    .from("activity_feed")
    .select("*")
    .eq("team_id", team.id)
    .order("created_at", { ascending: false })
    .limit(12);
  if (activityError) throw activityError;

  return {
    tombstone,
    team,
    deathMatch,
    tributes: ((tributeRows ?? []) as DbTribute[]).map((row) => tributeFromDb(row, teamsById)),
    activity: ((activityRows ?? []) as DbActivity[]).map((row) => activityFromDb(row, teamsById)),
  };
}

export async function interactWithTombstone(
  id: string,
  interactionType: InteractionType,
): Promise<Tombstone> {
  const client = getServerClient();
  if (!client) return interactWithDemoTombstone(id, interactionType);

  if (!["flower", "candle", "incense"].includes(interactionType)) {
    throw new Error("Unknown ritual.");
  }

  const details = await getTombstoneDetails(id);
  if (!details) throw new Error("Tombstone not found.");
  const key =
    interactionType === "flower"
      ? "flower_count"
      : interactionType === "candle"
        ? "candle_count"
        : "incense_count";
  const currentKey =
    interactionType === "flower"
      ? "flowerCount"
      : interactionType === "candle"
        ? "candleCount"
        : "incenseCount";

  const { data, error } = await client
    .from("tombstones")
    .update({ [key]: details.tombstone[currentKey] + 1 })
    .eq("id", details.tombstone.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to record ritual.");

  await client.from("interactions").insert({
    id: makeId("int"),
    tombstone_id: details.tombstone.id,
    team_id: details.team.id,
    interaction_type: interactionType,
  });
  await addActivity(client, {
    activity_type:
      interactionType === "flower"
        ? "flower_offered"
        : interactionType === "candle"
          ? "candle_lit"
          : "incense_burned",
    team_id: details.team.id,
    tombstone_id: details.tombstone.id,
    tribute_id: null,
    interaction_type: interactionType,
    display_text: `Someone ${interactionType === "flower" ? "left flowers" : interactionType === "candle" ? "lit a candle" : "burned incense"} for ${details.team.name}.`,
  });

  return tombstoneFromDb(data as DbTombstone, new Map([[details.team.id, details.team]]));
}

export async function leaveTribute(
  id: string,
  tributeText: string,
  authorName: string,
  subjectHash?: string,
): Promise<Tribute> {
  const client = getServerClient();
  if (!client) return leaveDemoTribute(id, tributeText, authorName);

  const validation = validateUserText(tributeText, 160);
  if (!validation.ok) throw new Error(validation.message);
  const details = await getTombstoneDetails(id);
  if (!details) throw new Error("Tombstone not found.");
  const author = cleanSignature(authorName);

  const { data: recentTributes, error: recentError } = await client
    .from("tributes")
    .select("tribute_text, author_name, created_at")
    .eq("tombstone_id", details.tombstone.id)
    .eq("subject_hash", subjectHash ?? "")
    .order("created_at", { ascending: false })
    .limit(8);
  const canCheckSubjectDuplicates = !recentError;
  if (recentError && !isMissingColumnError(recentError, "subject_hash")) throw recentError;

  const isDuplicate =
    canCheckSubjectDuplicates &&
    ((recentTributes ?? []) as Pick<DbTribute, "tribute_text" | "author_name" | "created_at">[]).some(
      (tribute) =>
        isDuplicateTributeSubmission({
          existingText: tribute.tribute_text,
          existingAuthor: tribute.author_name,
          existingCreatedAt: tribute.created_at,
          nextText: tributeText,
          nextAuthor: author,
          now: new Date(),
          windowMs: 90_000,
        }),
    );

  if (isDuplicate) {
    throw new Error("This tribute was already received. Give the paperwork a breath.");
  }

  const tributeRow = {
    id: makeId("tri"),
    tombstone_id: details.tombstone.id,
    team_id: details.team.id,
    tribute_text: tributeText.trim(),
    author_name: author,
    subject_hash: subjectHash,
  };
  let { data, error } = await client.from("tributes").insert(tributeRow).select("*").single();
  if (error && isMissingColumnError(error, "subject_hash")) {
    const legacyTributeRow = {
      id: tributeRow.id,
      tombstone_id: tributeRow.tombstone_id,
      team_id: tributeRow.team_id,
      tribute_text: tributeRow.tribute_text,
      author_name: tributeRow.author_name,
    };
    const retry = await client.from("tributes").insert(legacyTributeRow).select("*").single();
    data = retry.data;
    error = retry.error;
  }
  if (error || !data) throw new Error(error?.message ?? "Unable to receive tribute.");

  await client
    .from("tombstones")
    .update({ tribute_count: details.tombstone.tributeCount + 1 })
    .eq("id", details.tombstone.id);
  await addActivity(client, {
    activity_type: "tribute_left",
    team_id: details.team.id,
    tombstone_id: details.tombstone.id,
    tribute_id: tributeRow.id,
    interaction_type: null,
    display_text: `${tributeRow.author_name} left a tribute for ${details.team.name}: "${tributeRow.tribute_text}"`,
  });

  return tributeFromDb(data as DbTribute, new Map([[details.team.id, details.team]]));
}

export async function voteOnTribute({
  tributeId,
  voteType,
  subjectHash,
}: {
  tributeId: string;
  voteType: TributeVoteType;
  subjectHash: string;
}) {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for tribute voting.");
  if (voteType !== "like" && voteType !== "dislike") {
    throw new Error("Unknown tribute vote.");
  }

  const { data: tributeRow, error: tributeError } = await client
    .from("tributes")
    .select("*")
    .eq("id", tributeId)
    .eq("moderation_status", "approved")
    .single();
  if (tributeError || !tributeRow) throw new Error("Tribute not found.");

  const { data: existingVote, error: voteError } = await client
    .from("tribute_votes")
    .select("*")
    .eq("tribute_id", tributeId)
    .eq("subject_hash", subjectHash)
    .maybeSingle();
  if (voteError) throw voteError;

  const nextCounts = applyTributeVote({
    currentLikeCount: (tributeRow as DbTribute).like_count ?? 0,
    currentDislikeCount: (tributeRow as DbTribute).dislike_count ?? 0,
    previousVoteType: (existingVote as DbTributeVote | null)?.vote_type ?? null,
    nextVoteType: voteType,
  });

  if (nextCounts.changed) {
    await client.from("tribute_votes").upsert({
      id: (existingVote as DbTributeVote | null)?.id ?? makeId("tv"),
      tribute_id: tributeId,
      vote_type: voteType,
      subject_hash: subjectHash,
      updated_at: now(),
    });
    const { error: updateError } = await client
      .from("tributes")
      .update({
        like_count: nextCounts.likeCount,
        dislike_count: nextCounts.dislikeCount,
      })
      .eq("id", tributeId);
    if (updateError) throw updateError;
  }

  return {
    tributeId,
    likeCount: nextCounts.likeCount,
    dislikeCount: nextCounts.dislikeCount,
    changed: nextCounts.changed,
  };
}

export async function getTombstoneDetailsByTributeId(tributeId: string) {
  const client = getServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("tributes")
    .select("tombstone_id")
    .eq("id", tributeId)
    .maybeSingle();
  if (error || !data) return null;

  return getTombstoneDetails((data as { tombstone_id: string }).tombstone_id);
}

export async function getActivityFeed(): Promise<ActivityItem[]> {
  const client = getServerClient();
  if (!client) return getDemoActivityFeed();

  const teams = await loadTeamsWithCounts(client);
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const { data, error } = await client
    .from("activity_feed")
    .select("*")
    .eq("activity_type", "tombstone_created")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as DbActivity[]).map((row) => activityFromDb(row, teamsById));
}

export async function createReport(input: ReportInput) {
  const client = getServerClient();
  const validation = validateUserText(input.reason, 160);
  if (!validation.ok) throw new Error(validation.message);
  if (!client) {
    return { id: makeId("rep"), status: "received" };
  }

  const { data, error } = await client
    .from("reports")
    .insert({
      id: makeId("rep"),
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason.trim(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to receive report.");

  if (input.targetType === "tribute") {
    const { data: tribute } = await client
      .from("tributes")
      .select("report_count")
      .eq("id", input.targetId)
      .maybeSingle();
    if (tribute) {
      await client
        .from("tributes")
        .update({ report_count: ((tribute as { report_count: number }).report_count ?? 0) + 1 })
        .eq("id", input.targetId);
    }
  }

  return { id: data.id as string, status: "received" };
}

export async function handleAdminReport(reportId: string, action: AdminReportAction) {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for report moderation.");
  if (action !== "dismiss" && action !== "hide_content") {
    throw new Error("Unknown report action.");
  }

  const { data: report, error } = await client
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single();
  if (error || !report) throw new Error("Report not found.");

  const reportRow = report as {
    target_type: "tombstone" | "tribute";
    target_id: string;
  };

  if (action === "hide_content") {
    if (reportRow.target_type === "tribute") {
      await client
        .from("tributes")
        .update({ moderation_status: "rejected" })
        .eq("id", reportRow.target_id);
    } else {
      await client
        .from("tombstones")
        .update({ is_public: false, moderation_status: "rejected" })
        .eq("id", reportRow.target_id);
    }
  }

  const { error: updateError } = await client
    .from("reports")
    .update({ status: action === "dismiss" ? "dismissed" : "reviewed" })
    .eq("id", reportId);
  if (updateError) throw updateError;

  return { ok: true, reportId, status: action === "dismiss" ? "dismissed" : "reviewed" };
}

export async function getAdminSnapshot() {
  const client = getServerClient();
  if (!client) {
    return {
      teams: getDemoTeamsWithCounts(),
      syncRuns: [],
      reports: [],
      statusEvents: [],
      contentItems: Object.values(teamContentPacks).flatMap((pack) => [
        ...pack.causes.slice(0, 3).map((item) => ({
          id: item.id,
          type: "cause",
          teamSlug: pack.teamSlug,
          text: item.text,
          generated: false,
        })),
        ...pack.epitaphs.slice(0, 2).map((item) => ({
          id: item.id,
          type: "epitaph",
          teamSlug: pack.teamSlug,
          text: item.text,
          generated: false,
        })),
      ]),
      usingFallback: true,
    };
  }

  const [teams, syncRuns, reports, statusEvents, causes, epitaphs] = await Promise.all([
    loadTeamsWithCounts(client),
    client.from("sync_runs").select("*").order("created_at", { ascending: false }).limit(20),
    client.from("reports").select("*").order("created_at", { ascending: false }).limit(30),
    client
      .from("team_status_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
    client
      .from("cause_library")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(80),
    client
      .from("epitaph_library")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  if (syncRuns.error) throw syncRuns.error;
  if (reports.error) throw reports.error;
  if (statusEvents.error) throw statusEvents.error;
  if (causes.error) throw causes.error;
  if (epitaphs.error) throw epitaphs.error;

  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return {
    teams,
    syncRuns: syncRuns.data ?? [],
    reports: reports.data ?? [],
    statusEvents: statusEvents.data ?? [],
    contentItems: [
      ...(((causes.data ?? []) as DbCause[]).map((item) => ({
        id: item.id,
        type: "cause",
        teamSlug: item.team_id ? teamsById.get(item.team_id)?.slug ?? "unknown" : "generic",
        text: item.cause_text,
        generated: Boolean(item.is_user_generated),
      }))),
      ...(((epitaphs.data ?? []) as DbEpitaph[]).map((item) => ({
        id: item.id,
        type: "epitaph",
        teamSlug: item.team_id ? teamsById.get(item.team_id)?.slug ?? "unknown" : "generic",
        text: item.epitaph_text,
        generated: Boolean(item.is_user_generated),
      }))),
    ],
    usingFallback: false,
  };
}

export async function rollbackTeamStatus(teamSlug: string) {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for admin rollback.");

  const seeded = seededTeams.find((team) => team.slug === teamSlug);
  if (!seeded) throw new Error("Unknown team.");

  const { error } = await client
    .from("teams")
    .update({
      status: seeded.status,
      is_playable: seeded.isPlayable,
      eliminated_at: seeded.eliminatedAt,
      death_match_id: seeded.deathMatchId,
      updated_at: now(),
    })
    .eq("slug", teamSlug);
  if (error) throw error;
  return { ok: true };
}

export async function updateTeamStatusManually(
  teamSlug: string,
  input: ManualStatusInput,
) {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for admin status updates.");

  const update = normalizeManualTeamStatusUpdate(input);
  const { data: teamRow, error: teamError } = await client
    .from("teams")
    .select("*")
    .eq("slug", teamSlug)
    .single();
  if (teamError || !teamRow) throw new Error("Unknown team.");

  const team = teamFromDb(teamRow as DbTeam);
  const { error } = await client
    .from("teams")
    .update({
      status: update.status,
      is_playable: update.isPlayable,
      eliminated_at: update.eliminatedAt,
      death_match_id: update.deathMatchId,
      updated_at: now(),
    })
    .eq("slug", teamSlug);
  if (error) throw error;

  const { error: eventError } = await client.from("team_status_events").insert({
    id: makeId("tse"),
    team_id: team.id,
    provider_match_id: update.deathMatchId,
    from_status: team.status,
    to_status: update.status,
    reason: update.reason,
    source: "manual_admin",
  });
  if (eventError) throw eventError;

  return { ok: true, teamSlug, status: update.status, isPlayable: update.isPlayable };
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function ensureFootballAnchor(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (/\bfootball\b/i.test(trimmed)) return trimmed;
  const suffix = " football";
  if (trimmed.length + suffix.length <= maxLength) return `${trimmed}${suffix}`;
  return `${trimmed.slice(0, maxLength - suffix.length).trimEnd()}${suffix}`;
}

export async function deactivateContentItem(id: string, type: "cause" | "epitaph") {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for content moderation.");
  const table = type === "cause" ? "cause_library" : "epitaph_library";
  const { error } = await client.from(table).update({ is_active: false, updated_at: now() }).eq("id", id);
  if (error) throw error;
  return { ok: true, id, type };
}

export async function runMemeContentSync(teamSlug?: string) {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for meme content sync.");

  const started = Date.now();
  const syncRunId = makeId("sync");
  await client.from("sync_runs").insert({
    id: syncRunId,
    provider: "deepseek",
    status: "running",
    started_at: new Date(started).toISOString(),
  });

  try {
    const teams = await loadTeamsWithCounts(client);
    const teamLimit = parsePositiveInt(process.env.MEME_REFRESH_HOT_TEAM_LIMIT, 8);
    const maxItems = parsePositiveInt(process.env.MEME_REFRESH_MAX_ITEMS_PER_TEAM, 3);
    const candidates = teams
      .filter((team) => (teamSlug ? team.slug === teamSlug : true))
      .filter((team) => team.status !== "pending")
      .sort((a, b) => {
        const left = teamContentPacks[a.slug]?.priority === "hot" ? 0 : 1;
        const right = teamContentPacks[b.slug]?.priority === "hot" ? 0 : 1;
        return left - right || a.name.localeCompare(b.name);
      })
      .slice(0, teamSlug ? 1 : teamLimit);

    if (teamSlug && !candidates.length) throw new Error("Unknown team.");

    let changed = 0;
    const notes: string[] = [];

    for (const team of candidates) {
      const content = await getContentOptions(team.slug);
      const matchContext = team.deathMatchId
        ? `${team.name} status: ${team.status}; death match id: ${team.deathMatchId}; eliminated at: ${team.eliminatedAt ?? "unknown"}.`
        : `${team.name} status: ${team.status}; no elimination match yet. Generate pre-elimination fan pain that can fit future paperwork.`;
      const generated = await generateDeepSeekMemeContent({
        teamName: team.name,
        teamSlug: team.slug,
        priority: content.priority,
        matchContext,
        existingCauses: content.causes.map((cause) => cause.text),
        existingEpitaphs: content.epitaphs.map((epitaph) => epitaph.text),
        causeCount: maxItems,
        epitaphCount: maxItems,
      });
      const filtered = filterGeneratedLines({
        causes: generated.causes.map((line) => ensureFootballAnchor(line, 80)),
        epitaphs: generated.epitaphs.map((line) => ensureFootballAnchor(line, 120)),
        existingCauses: content.causes.map((cause) => cause.text),
        existingEpitaphs: content.epitaphs.map((epitaph) => epitaph.text),
      });

      if (filtered.rejected.length) {
        notes.push(
          `${team.slug}: rejected batch (${filtered.rejected.map((item) => item.reason).join("; ")})`,
        );
        continue;
      }

      const scenario = JSON.stringify({
        provider: "deepseek",
        syncRunId,
        matchContext,
      });
      const causeRows = filtered.causes.map((text) => ({
        id: makeId("cause"),
        team_id: team.id,
        cause_text: text,
        category: "generated",
        scenario,
        is_team_specific: true,
        is_user_generated: true,
        is_active: true,
      }));
      const epitaphRows = filtered.epitaphs.map((text) => ({
        id: makeId("epitaph"),
        team_id: team.id,
        epitaph_text: text,
        tone: "generated",
        scenario,
        is_team_specific: true,
        is_user_generated: true,
        is_active: true,
      }));

      if (causeRows.length) {
        const { error } = await client.from("cause_library").insert(causeRows);
        if (error) throw error;
      }
      if (epitaphRows.length) {
        const { error } = await client.from("epitaph_library").insert(epitaphRows);
        if (error) throw error;
      }
      changed += causeRows.length + epitaphRows.length;
      notes.push(`${team.slug}: published ${causeRows.length + epitaphRows.length}`);
    }

    await client
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: now(),
        processed_count: candidates.length,
        changed_count: changed,
        error_message: notes.join("\n") || null,
      })
      .eq("id", syncRunId);

    return {
      status: "success",
      processed: candidates.length,
      changed,
      notes,
    };
  } catch (error) {
    await client
      .from("sync_runs")
      .update({
        status: "error",
        finished_at: now(),
        error_message: error instanceof Error ? error.message : "Unknown meme sync error",
      })
      .eq("id", syncRunId);
    throw error;
  }
}

export async function runWorldCupSync() {
  const client = getServerClient();
  if (!client) throw new Error("Supabase is required for World Cup sync.");
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) throw new Error("FOOTBALL_DATA_API_TOKEN is not configured.");

  const started = Date.now();
  const syncRunId = makeId("sync");
  await client.from("sync_runs").insert({
    id: syncRunId,
    provider: "football-data",
    status: "running",
    started_at: new Date(started).toISOString(),
  });

  try {
    const events = (await fetchFootballDataWorldCupMatches(token)) as NormalizedMatchEvent[];
    const teams = await loadTeamsWithCounts(client);
    const { data: existingRows, error: existingError } = await client
      .from("provider_matches")
      .select("provider_match_id");
    if (existingError) throw existingError;

    const result = applyWorldCupMatchEvents({
      teams,
      existingProviderMatchIds: new Set(
        ((existingRows ?? []) as { provider_match_id: string }[]).map(
          (row) => row.provider_match_id,
        ),
      ),
      events,
    });
    const teamsBySlug = new Map(teams.map((team) => [team.slug, team]));

    for (const event of events) {
      await client.from("provider_matches").upsert({
        id: makeId("pm"),
        provider: event.provider,
        provider_match_id: event.providerMatchId,
        stage: event.stage,
        match_date: event.date,
        raw_hash: event.rawHash,
        payload_summary: event,
      });
    }

    for (const update of result.teamUpdates) {
      const team = teamsBySlug.get(update.slug);
      await client.from("matches").upsert({
        id: update.deathMatchId,
        stage: events.find((event) => `match_${event.providerMatchId.replace(/[^a-z0-9]+/gi, "_")}` === update.deathMatchId)?.stage ?? "World Cup",
        date: update.eliminatedAt,
        loser_team_id: team?.id,
        status: "final",
        source: "football-data.org",
      });
      await client
        .from("teams")
        .update({
          status: update.status,
          is_playable: update.isPlayable,
          eliminated_at: update.eliminatedAt,
          death_match_id: update.deathMatchId,
          updated_at: now(),
        })
        .eq("slug", update.slug);
    }

    for (const event of result.statusEvents) {
      const team = teamsBySlug.get(event.teamSlug);
      if (!team) continue;
      await client.from("team_status_events").insert({
        id: makeId("tse"),
        team_id: team.id,
        provider_match_id: event.providerMatchId,
        from_status: event.fromStatus,
        to_status: event.toStatus,
        reason: event.reason,
        source: event.source,
      });
    }

    await client
      .from("sync_runs")
      .update({
        status: "success",
        finished_at: now(),
        processed_count: events.length,
        changed_count: result.teamUpdates.length,
        error_message: result.skipped.join("\n") || null,
      })
      .eq("id", syncRunId);

    return {
      status: "success",
      processed: events.length,
      changed: result.teamUpdates.length,
      skipped: result.skipped,
    };
  } catch (error) {
    await client
      .from("sync_runs")
      .update({
        status: "error",
        finished_at: now(),
        error_message: error instanceof Error ? error.message : "Unknown sync error",
      })
      .eq("id", syncRunId);
    throw error;
  }
}

export const repositoryInternals = {
  ensureFootballAnchor,
};
