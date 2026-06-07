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
import { italyDeathMatch, matches as seededMatches, teams as seededTeams } from "./seed-data";
import {
  applyWorldCupMatchEvents,
  fetchFootballDataWorldCupMatches,
  type NormalizedMatchEvent,
} from "./world-cup-sync";
import { cleanSignature, validateUserText } from "./validation";
import type {
  ActivityItem,
  InteractionType,
  Match,
  Team,
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

const rateLimitConfig = {
  create_tombstone: { limit: 8, windowMs: 60 * 60 * 1000 },
  ritual: { limit: 120, windowMs: 60 * 60 * 1000 },
  tribute: { limit: 20, windowMs: 60 * 60 * 1000 },
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

let serverClient: SupabaseClient | null = null;

function hasServerSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

function getServerClient() {
  if (!hasServerSupabaseConfig()) {
    return null;
  }

  if (!serverClient) {
    serverClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  return serverClient;
}

const now = () => new Date().toISOString();

function makeId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
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

export async function getCreateOptions() {
  const teams = (await getTeamsWithCounts()).filter((team) => team.isPlayable);
  const client = getServerClient();
  if (client) {
    const teamsById = new Map((await loadTeamsWithCounts(client)).map((team) => [team.id, team]));
    const matchIds = teams.map((team) => team.deathMatchId).filter(Boolean) as string[];
    if (matchIds.length) {
      const { data, error } = await client.from("matches").select("*").in("id", matchIds);
      if (error) throw error;
      return {
        teams,
        matches: ((data ?? []) as DbMatch[]).map((row) => matchFromDb(row, teamsById)),
      };
    }
  }

  return {
    teams,
    matches: seededMatches,
  };
}

export async function createTombstoneRecord(input: CreateInput): Promise<Tombstone> {
  const client = getServerClient();
  if (!client) return createDemoTombstoneRecord(input);

  const [causeValidation, epitaphValidation, signatureValidation] = [
    validateUserText(input.causeOfDeath, 80),
    validateUserText(input.epitaph, 120),
    validateUserText(input.buriedBy, 30),
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
  tombstoneRow.share_slug = tombstoneRow.id;

  const { data, error } = await client.from("tombstones").insert(tombstoneRow).select("*").single();
  if (error || !data) throw new Error(error?.message ?? "Unable to publish tombstone.");

  await addActivity(client, {
    activity_type: "tombstone_created",
    team_id: team.id,
    tombstone_id: tombstoneRow.id,
    tribute_id: null,
    interaction_type: null,
    display_text: `${tombstoneRow.buried_by} buried ${team.name}. Cause of death: ${tombstoneRow.cause_of_death}.`,
  });

  return tombstoneFromDb(data as DbTombstone, new Map([[team.id, team]]));
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
): Promise<Tribute> {
  const client = getServerClient();
  if (!client) return leaveDemoTribute(id, tributeText, authorName);

  const validation = validateUserText(tributeText, 160);
  if (!validation.ok) throw new Error(validation.message);
  const details = await getTombstoneDetails(id);
  if (!details) throw new Error("Tombstone not found.");

  const tributeRow = {
    id: makeId("tri"),
    tombstone_id: details.tombstone.id,
    team_id: details.team.id,
    tribute_text: tributeText.trim(),
    author_name: cleanSignature(authorName),
  };
  const { data, error } = await client.from("tributes").insert(tributeRow).select("*").single();
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
  return { id: data.id as string, status: "received" };
}

export async function getAdminSnapshot() {
  const client = getServerClient();
  if (!client) {
    return {
      teams: getDemoTeamsWithCounts(),
      syncRuns: [],
      reports: [],
      statusEvents: [],
      usingFallback: true,
    };
  }

  const [teams, syncRuns, reports, statusEvents] = await Promise.all([
    loadTeamsWithCounts(client),
    client.from("sync_runs").select("*").order("created_at", { ascending: false }).limit(20),
    client.from("reports").select("*").order("created_at", { ascending: false }).limit(30),
    client
      .from("team_status_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (syncRuns.error) throw syncRuns.error;
  if (reports.error) throw reports.error;
  if (statusEvents.error) throw statusEvents.error;

  return {
    teams,
    syncRuns: syncRuns.data ?? [],
    reports: reports.data ?? [],
    statusEvents: statusEvents.data ?? [],
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
