import { cleanSignature, validateUserText } from "./validation";
import { italyDeathMatch, matches, teams as seededTeams } from "./seed-data";
import type {
  ActivityItem,
  InteractionType,
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

const globalForStore = globalThis as typeof globalThis & {
  __wcfhStore?: {
    tombstones: Tombstone[];
    tributes: Tribute[];
    activity: ActivityItem[];
  };
};

const store =
  globalForStore.__wcfhStore ??
  (globalForStore.__wcfhStore = {
    tombstones: [],
    tributes: [],
    activity: [],
  });

const now = () => new Date().toISOString();

function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function addActivity(item: Omit<ActivityItem, "id" | "createdAt">) {
  store.activity.unshift({
    id: makeId("act"),
    createdAt: now(),
    ...item,
  });
}

export function getHomeSnapshot() {
  const teams = getTeamsWithCounts();
  return {
    teams,
    latestTombstones: [...store.tombstones].slice(0, 6),
    activity: [...store.activity].slice(0, 30),
  };
}

export function getTeamsWithCounts(): Team[] {
  return seededTeams.map((team) => {
    const teamTombstones = store.tombstones.filter(
      (tombstone) => tombstone.teamSlug === team.slug,
    );
    const teamTributes = store.tributes.filter(
      (tribute) => tribute.teamSlug === team.slug,
    );

    return {
      ...team,
      tombstoneCount: teamTombstones.length,
      flowerCount: teamTombstones.reduce((sum, item) => sum + item.flowerCount, 0),
      candleCount: teamTombstones.reduce((sum, item) => sum + item.candleCount, 0),
      incenseCount: teamTombstones.reduce(
        (sum, item) => sum + item.incenseCount,
        0,
      ),
      tributeCount: teamTributes.length,
    };
  });
}

export function createTombstoneRecord(input: CreateInput): Tombstone {
  const team = seededTeams.find((candidate) => candidate.slug === input.teamSlug);

  if (!team?.isPlayable) {
    throw new Error("This team is not available for burial yet.");
  }

  const causeValidation = validateUserText(input.causeOfDeath, 80);
  const epitaphValidation = validateUserText(input.epitaph, 120);
  const signatureValidation = validateUserText(input.buriedBy, 30);

  for (const result of [causeValidation, epitaphValidation, signatureValidation]) {
    if (!result.ok) {
      throw new Error(result.message);
    }
  }

  const tombstone: Tombstone = {
    id: makeId("ts"),
    teamSlug: team.slug,
    deathMatchId: team.deathMatchId ?? italyDeathMatch.id,
    causeOfDeath: input.causeOfDeath.trim(),
    epitaph: input.epitaph.trim(),
    buriedBy: cleanSignature(input.buriedBy),
    createdAt: now(),
    shareSlug: "",
    flowerCount: 0,
    candleCount: 0,
    incenseCount: 0,
    tributeCount: 0,
    isPublic: true,
    moderationStatus: "approved",
  };
  tombstone.shareSlug = tombstone.id;
  store.tombstones.unshift(tombstone);
  addActivity({
    activityType: "tombstone_created",
    teamSlug: team.slug,
    tombstoneId: tombstone.id,
    tributeId: null,
    interactionType: null,
    displayText: `${tombstone.buriedBy} buried ${team.name}. Cause of death: ${tombstone.causeOfDeath}.`,
  });

  return tombstone;
}

export function getTombstoneDetails(id: string): TombstoneDetails | null {
  const tombstone = store.tombstones.find(
    (candidate) => candidate.id === id || candidate.shareSlug === id,
  );

  if (!tombstone) {
    return null;
  }

  const team = getTeamsWithCounts().find(
    (candidate) => candidate.slug === tombstone.teamSlug,
  );
  const deathMatch = matches.find((match) => match.id === tombstone.deathMatchId);

  if (!team || !deathMatch) {
    return null;
  }

  return {
    tombstone,
    team,
    deathMatch,
    tributes: store.tributes.filter((tribute) => tribute.teamSlug === team.slug),
    activity: store.activity.filter((item) => item.teamSlug === team.slug).slice(0, 12),
  };
}

export function interactWithTombstone(
  id: string,
  interactionType: InteractionType,
): Tombstone {
  const tombstone = store.tombstones.find((candidate) => candidate.id === id);
  if (!tombstone) {
    throw new Error("Tombstone not found.");
  }

  const key =
    interactionType === "flower"
      ? "flowerCount"
      : interactionType === "candle"
        ? "candleCount"
        : "incenseCount";

  tombstone[key] += 1;

  const display =
    interactionType === "flower"
      ? "Someone left flowers for Italy."
      : interactionType === "candle"
        ? "Someone lit a candle for Italy."
        : "Someone burned incense for Italy.";

  addActivity({
    activityType:
      interactionType === "flower"
        ? "flower_offered"
        : interactionType === "candle"
          ? "candle_lit"
          : "incense_burned",
    teamSlug: tombstone.teamSlug,
    tombstoneId: tombstone.id,
    tributeId: null,
    interactionType,
    displayText: display,
  });

  return tombstone;
}

export function leaveTribute(id: string, tributeText: string, authorName: string) {
  const tombstone = store.tombstones.find((candidate) => candidate.id === id);
  if (!tombstone) {
    throw new Error("Tombstone not found.");
  }

  const validation = validateUserText(tributeText, 160);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const tribute: Tribute = {
    id: makeId("tri"),
    tombstoneId: tombstone.id,
    teamSlug: tombstone.teamSlug,
    tributeText: tributeText.trim(),
    authorName: cleanSignature(authorName),
    createdAt: now(),
    moderationStatus: "approved",
    reportCount: 0,
  };
  store.tributes.unshift(tribute);
  tombstone.tributeCount += 1;
  addActivity({
    activityType: "tribute_left",
    teamSlug: tombstone.teamSlug,
    tombstoneId: tombstone.id,
    tributeId: tribute.id,
    interactionType: null,
    displayText: `${tribute.authorName} left a tribute for Italy: “${tribute.tributeText}”`,
  });

  return tribute;
}

export function getActivityFeed() {
  return store.activity
    .filter((item) => item.activityType === "tombstone_created")
    .slice(0, 100);
}
