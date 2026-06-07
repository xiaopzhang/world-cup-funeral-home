import type { Match, Team } from "./types";

const flag = (code: string) => `https://flagcdn.com/w160/${code}.png`;

const qualifiedTeams = [
  ["Algeria", "algeria", "dz"],
  ["Argentina", "argentina", "ar"],
  ["Australia", "australia", "au"],
  ["Austria", "austria", "at"],
  ["Belgium", "belgium", "be"],
  ["Bosnia and Herzegovina", "bosnia-and-herzegovina", "ba"],
  ["Brazil", "brazil", "br"],
  ["Cabo Verde", "cabo-verde", "cv"],
  ["Canada", "canada", "ca"],
  ["Colombia", "colombia", "co"],
  ["Congo DR", "congo-dr", "cd"],
  ["Croatia", "croatia", "hr"],
  ["Curaçao", "curacao", "cw"],
  ["Czechia", "czechia", "cz"],
  ["Côte d'Ivoire", "cote-divoire", "ci"],
  ["Ecuador", "ecuador", "ec"],
  ["Egypt", "egypt", "eg"],
  ["England", "england", "gb-eng"],
  ["France", "france", "fr"],
  ["Germany", "germany", "de"],
  ["Ghana", "ghana", "gh"],
  ["Haiti", "haiti", "ht"],
  ["IR Iran", "ir-iran", "ir"],
  ["Iraq", "iraq", "iq"],
  ["Japan", "japan", "jp"],
  ["Jordan", "jordan", "jo"],
  ["Korea Republic", "korea-republic", "kr"],
  ["Mexico", "mexico", "mx"],
  ["Morocco", "morocco", "ma"],
  ["Netherlands", "netherlands", "nl"],
  ["New Zealand", "new-zealand", "nz"],
  ["Norway", "norway", "no"],
  ["Panama", "panama", "pa"],
  ["Paraguay", "paraguay", "py"],
  ["Portugal", "portugal", "pt"],
  ["Qatar", "qatar", "qa"],
  ["Saudi Arabia", "saudi-arabia", "sa"],
  ["Scotland", "scotland", "gb-sct"],
  ["Senegal", "senegal", "sn"],
  ["South Africa", "south-africa", "za"],
  ["Spain", "spain", "es"],
  ["Sweden", "sweden", "se"],
  ["Switzerland", "switzerland", "ch"],
  ["Tunisia", "tunisia", "tn"],
  ["Türkiye", "turkiye", "tr"],
  ["United States", "united-states", "us"],
  ["Uruguay", "uruguay", "uy"],
  ["Uzbekistan", "uzbekistan", "uz"],
] as const;

const emptyCounts = {
  tombstoneCount: 0,
  flowerCount: 0,
  candleCount: 0,
  incenseCount: 0,
  tributeCount: 0,
};

export const italyDeathMatch: Match = {
  id: "match_italy_early_admission",
  stage: "European Qualifying Playoff Final",
  date: "2026-03-31",
  venue: "Qualification waiting room",
  teamA: "Bosnia and Herzegovina",
  teamB: "Italy",
  teamAScore: 1,
  teamBScore: 1,
  extraTime: false,
  penaltyScore: "Bosnia and Herzegovina won on penalties",
  winnerTeamSlug: "bosnia-and-herzegovina",
  loserTeamSlug: "italy",
  status: "final",
  source: "MVP fixed death event from product requirements",
  displayText:
    "Death Match: Bosnia and Herzegovina 1-1 Italy. Bosnia and Herzegovina won on penalties. European Qualifying Playoff Final.",
  broadcastText:
    "Italy didn’t die at the World Cup. Italy died trying to get invited.",
};

export const teams: Team[] = [
  ...qualifiedTeams.map(
    ([name, slug, code]): Team => ({
      id: `team_${slug}`,
      name,
      slug,
      countryCode: code,
      flagUrl: flag(code),
      status: "alive",
      admissionType: "world_cup_elimination",
      isPlayable: false,
      eliminatedAt: null,
      deathMatchId: null,
      ...emptyCounts,
    }),
  ),
  {
    id: "team_italy",
    name: "Italy",
    slug: "italy",
    countryCode: "it",
    flagUrl: flag("it"),
    status: "early_admission",
    admissionType: "early_admission",
    isPlayable: true,
    eliminatedAt: "2026-03-31",
    deathMatchId: italyDeathMatch.id,
    ...emptyCounts,
  } satisfies Team,
].sort((a, b) => a.name.localeCompare(b.name));

export function getPlayableTeams() {
  return teams.filter((team) => team.isPlayable);
}

export const matches: Match[] = [italyDeathMatch];

export const genericCauses = [
  "Penalty heartbreak",
  "Last-minute collapse",
  "Group stage disaster",
  "VAR incident",
  "Manager disasterclass",
  "Goalkeeper mistake",
  "Striker missed everything",
  "Too much hope before kickoff",
  "Curse activated",
  "Classic national trauma",
  "Golden generation expired",
  "Football gods said no",
  "Tactical overthinking",
  "Emotional damage beyond repair",
  "Defensive system disappeared",
  "Extra-time soul drain",
  "Hope died before the final whistle",
  "The scoreboard committed violence",
];

export const italyCauses = [
  "Football royalty denied entry",
  "Four stars, zero invitations",
  "The World Cup watched from home",
  "Qualification trauma relapse",
  "Penalty heartbreak, Italian edition",
  "The Azzurri missed the bus",
  "Catenaccio couldn’t defend destiny",
  "The anthem was ready. The invitation was not.",
];

export function getCauseOptions(teamSlug: string) {
  if (teamSlug === "italy") {
    return [...genericCauses, ...italyCauses];
  }

  return genericCauses;
}

export const italyEpitaphs = [
  "Four stars above the badge. No seat at the table.",
  "The anthem was ready. The invitation was not.",
  "Here lies a giant, locked outside its own museum.",
  "Catenaccio defended everything except fate.",
  "Italy didn’t lose the World Cup. It lost the doorway.",
];

export const shareHooks = {
  tombstone: [
    "I just buried Italy before the World Cup even started.",
    "Italy didn’t make the World Cup, so I made them a tombstone.",
    "Four-time champions. Zero invitation. I had to bury Italy.",
    "Italy died at the gate. Come pay your respects.",
  ],
  flower: "I left flowers for Italy. Come send them off properly.",
  candle: "I lit a candle for Italy. The football gods owe us answers.",
  incense: "I burned incense for Italy. May they return stronger in 2030.",
  tribute: "I left a tribute for Italy. It’s cheaper than therapy.",
};
