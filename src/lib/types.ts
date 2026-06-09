export type TeamStatus =
  | "alive"
  | "eliminated"
  | "early_admission"
  | "champion"
  | "pending";

export type AdmissionType = "world_cup_elimination" | "early_admission";

export type InteractionType = "flower" | "candle" | "incense";

export type ContentPriority = "hot" | "standard";

export type CauseOption = {
  id: string;
  text: string;
  category: "generic" | "team" | "generated";
  isTeamSpecific: boolean;
};

export type EpitaphOption = {
  id: string;
  text: string;
  tone: "dark_comedy" | "fan_pain" | "generated";
  isTeamSpecific: boolean;
};

export type ShareHookSet = {
  tombstone: string[];
  flower: string;
  candle: string;
  incense: string;
  tribute: string;
};

export type TeamContentPack = {
  teamSlug: string;
  priority: ContentPriority;
  causes: CauseOption[];
  epitaphs: EpitaphOption[];
  shareHooks: ShareHookSet;
};

export type ActivityType =
  | "tombstone_created"
  | "flower_offered"
  | "candle_lit"
  | "incense_burned"
  | "tribute_left";

export type Team = {
  id: string;
  name: string;
  slug: string;
  countryCode: string;
  flagUrl: string;
  status: TeamStatus;
  admissionType: AdmissionType;
  isPlayable: boolean;
  eliminatedAt: string | null;
  deathMatchId: string | null;
  tombstoneCount: number;
  flowerCount: number;
  candleCount: number;
  incenseCount: number;
  tributeCount: number;
};

export type Match = {
  id: string;
  stage: string;
  date: string;
  venue: string;
  teamA: string;
  teamB: string;
  teamAScore: number;
  teamBScore: number;
  extraTime: boolean;
  penaltyScore: string | null;
  winnerTeamSlug: string;
  loserTeamSlug: string;
  status: "final";
  source: string;
  displayText: string;
  broadcastText: string;
};

export type Tombstone = {
  id: string;
  teamSlug: string;
  deathMatchId: string;
  causeOfDeath: string;
  epitaph: string;
  buriedBy: string;
  createdAt: string;
  shareSlug: string;
  flowerCount: number;
  candleCount: number;
  incenseCount: number;
  tributeCount: number;
  isPublic: boolean;
  moderationStatus: "approved" | "pending" | "rejected";
};

export type Tribute = {
  id: string;
  tombstoneId: string;
  teamSlug: string;
  tributeText: string;
  authorName: string;
  createdAt: string;
  moderationStatus: "approved" | "pending" | "rejected";
  reportCount: number;
  likeCount: number;
  dislikeCount: number;
};

export type ActivityItem = {
  id: string;
  activityType: ActivityType;
  teamSlug: string;
  tombstoneId: string | null;
  tributeId: string | null;
  interactionType: InteractionType | null;
  displayText: string;
  createdAt: string;
};

export type TombstoneDetails = {
  tombstone: Tombstone;
  team: Team;
  deathMatch: Match;
  tributes: Tribute[];
  activity: ActivityItem[];
};
