import type { CauseOption, EpitaphOption, Match, ShareHookSet, Team, TeamContentPack } from "./types";

const flagOverrides: Record<string, string> = {
  ma: "/flags/ma.svg",
};

const flag = (code: string) => flagOverrides[code] ?? `https://flagcdn.com/w160/${code}.png`;

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

const hotTeamSlugs = new Set([
  "argentina",
  "brazil",
  "england",
  "france",
  "germany",
  "italy",
  "japan",
  "korea-republic",
  "mexico",
  "morocco",
  "netherlands",
  "portugal",
  "spain",
  "united-states",
]);

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

const genericEpitaphs = [
  "They arrived with hope. Football handled the paperwork.",
  "The dream was loud. The final whistle was louder.",
  "Beloved by fans, betrayed by the scoreboard.",
  "Here lies a campaign that needed one more miracle.",
  "May the replay never find them.",
];

const specialContent: Record<string, { causes: string[]; epitaphs: string[] }> = {
  argentina: {
    causes: [
      "The last dance slipped on extra time",
      "Too much magic, not enough oxygen",
      "Messi discourse reached terminal velocity",
      "Penalty destiny filed for retirement",
    ],
    epitaphs: [
      "The nation held its breath. The bracket did not.",
      "They brought romance. Football brought terms and conditions.",
    ],
  },
  brazil: {
    causes: [
      "Samba ran into a low block",
      "Jogo bonito met knockout math",
      "The dance was reviewed by VAR",
      "Five stars, one very heavy silence",
    ],
    epitaphs: [
      "The dance was beautiful. The ending was not.",
      "Here lies flair, tackled by consequence.",
    ],
  },
  england: {
    causes: [
      "Football nearly came home and missed the stop",
      "Penalty trauma opened the family album",
      "Tournament optimism suffered a familiar leak",
      "A nation refreshed the weather app for 1966",
    ],
    epitaphs: [
      "It was coming home. It took a connecting flight elsewhere.",
      "Here lies another perfectly reasonable national overreaction.",
    ],
  },
  france: {
    causes: [
      "The talent factory forgot the receipt",
      "Too many stars, one cloudy night",
      "A superteam found mortal paperwork",
      "The counterattack ran out of runway",
    ],
    epitaphs: [
      "They had the squad list. Fate had the pen.",
      "Here lies elegance, briefly interrupted by football.",
    ],
  },
  germany: {
    causes: [
      "The machine needed a software update",
      "Tournament control panel displayed error 2018",
      "Efficiency met one inefficient afternoon",
      "The spreadsheet forgot about vibes",
    ],
    epitaphs: [
      "Order was restored, then immediately eliminated.",
      "Here lies the machine, unplugged by chaos.",
    ],
  },
  italy: {
    causes: [
      "Football royalty denied entry",
      "Four stars, zero invitations",
      "The World Cup watched from home",
      "Qualification trauma relapse",
      "Penalty heartbreak, Italian edition",
      "The Azzurri missed the bus",
      "Catenaccio couldn't defend destiny",
      "The anthem was ready. The invitation was not.",
    ],
    epitaphs: [
      "Four stars above the badge. No seat at the table.",
      "The anthem was ready. The invitation was not.",
      "Here lies a giant, locked outside its own museum.",
      "Catenaccio defended everything except fate.",
      "Italy didn't lose the World Cup. It lost the doorway.",
    ],
  },
  japan: {
    causes: [
      "The upset machine ran out of batteries",
      "Blue Lock discourse escaped containment",
      "Precision passing met knockout cruelty",
      "The bracket bowed, then bit back",
    ],
    epitaphs: [
      "They cleaned the room. The tournament did not return the favor.",
      "Here lies discipline, punished by one loose minute.",
    ],
  },
  "korea-republic": {
    causes: [
      "Stoppage time stopped being romantic",
      "Counterattack hope hit a red light",
      "The comeback drama lost its final episode",
      "A whole nation screamed at one offside line",
    ],
    epitaphs: [
      "They ran until the story ran out.",
      "Here lies belief, exhausted but not embarrassed.",
    ],
  },
  mexico: {
    causes: [
      "The fifth game remained a locked door",
      "Home continent pressure became luggage",
      "El Tri met the wall behind the wall",
      "A familiar curse renewed its subscription",
    ],
    epitaphs: [
      "The party was ready. The bracket checked the guest list.",
      "Here lies hope, one round from freedom.",
    ],
  },
  morocco: {
    causes: [
      "The miracle sequel faced studio notes",
      "A fortress finally found one cracked stone",
      "Atlas Lions ran into knockout gravity",
      "History asked for another receipt",
    ],
    epitaphs: [
      "They raised the ceiling. Football lowered the curtain.",
      "Here lies a roar that still shook the bracket.",
    ],
  },
  netherlands: {
    causes: [
      "Total Football became total heartbreak",
      "Orange theory failed the final exam",
      "The beautiful almost stayed almost",
      "Penalty shadows returned in orange",
    ],
    epitaphs: [
      "Always stylish, rarely spared.",
      "Here lies another Dutch masterpiece without a frame.",
    ],
  },
  portugal: {
    causes: [
      "The Ronaldo timeline ate itself",
      "A golden generation found the bronze exit",
      "Too much legacy, not enough minutes",
      "The discourse outshot the forwards",
    ],
    epitaphs: [
      "They carried history. The bracket charged overweight baggage.",
      "Here lies Portugal, eliminated by football and group chats.",
    ],
  },
  spain: {
    causes: [
      "One thousand passes, zero escape routes",
      "Tiki-taka met a locked mausoleum",
      "Possession won the spreadsheet, not the match",
      "The ball was theirs. The obituary was too",
    ],
    epitaphs: [
      "They kept the ball. Football kept the result.",
      "Here lies geometry, defeated by one straight line.",
    ],
  },
  "united-states": {
    causes: [
      "The soccer project met football reality",
      "Home pressure became a group chat wildfire",
      "Expected progress suffered actual consequences",
      "The hype train got CONCACAF'd by destiny",
    ],
    epitaphs: [
      "They called it soccer. The scoreboard called it over.",
      "Here lies the project, still somehow trending upward.",
    ],
  },
};

export const italyCauses = specialContent.italy.causes;

export const italyEpitaphs = specialContent.italy.epitaphs;

function makeCause(id: string, text: string, isTeamSpecific: boolean): CauseOption {
  return {
    id,
    text,
    category: isTeamSpecific ? "team" : "generic",
    isTeamSpecific,
  };
}

function makeEpitaph(id: string, text: string, isTeamSpecific: boolean): EpitaphOption {
  return {
    id,
    text,
    tone: isTeamSpecific ? "fan_pain" : "dark_comedy",
    isTeamSpecific,
  };
}

function baseTeamCauses(teamName: string) {
  return [
    `${teamName} hope collapsed under tournament gravity`,
    `${teamName} were escorted out by the football gods`,
    `${teamName} vibes failed the knockout stress test`,
    `${teamName} tactical plan met actual consequences`,
    `${teamName} optimism was declared medically unfit`,
    `${teamName} ran out of miracles before stoppage time`,
  ];
}

function baseTeamEpitaphs(teamName: string) {
  return [
    `Here lies ${teamName}, loved loudly and eliminated publicly.`,
    `${teamName} came with belief. The bracket came with receipts.`,
    `May ${teamName}'s fans find peace before the next qualifier.`,
    `The flag still waves. The campaign does not.`,
  ];
}

function makeShareHooks(teamName: string): ShareHookSet {
  return {
    tombstone: [
      `I just buried ${teamName} at World Cup Funeral Home.`,
      `${teamName} broke my bracket, so I gave them a tombstone.`,
      `Come pay respects to ${teamName}. Football has been cruel again.`,
    ],
    flower: `I left flowers for ${teamName}. Come send them off properly.`,
    candle: `I lit a candle for ${teamName}. The football gods owe us answers.`,
    incense: `I burned incense for ${teamName}. May the next cycle hurt less.`,
    tribute: `I left a tribute for ${teamName}. It is cheaper than therapy.`,
  };
}

function buildContentPack(team: Team): TeamContentPack {
  const special = specialContent[team.slug];
  const teamCauses = [...baseTeamCauses(team.name), ...(special?.causes ?? [])];
  const teamEpitaphs = [...baseTeamEpitaphs(team.name), ...(special?.epitaphs ?? [])];
  return {
    teamSlug: team.slug,
    priority: hotTeamSlugs.has(team.slug) ? "hot" : "standard",
    causes: [
      ...genericCauses.map((text, index) => makeCause(`cause_generic_${index + 1}`, text, false)),
      ...teamCauses.map((text, index) => makeCause(`cause_${team.slug}_${index + 1}`, text, true)),
    ],
    epitaphs: [
      ...genericEpitaphs.map((text, index) => makeEpitaph(`epitaph_generic_${index + 1}`, text, false)),
      ...teamEpitaphs.map((text, index) => makeEpitaph(`epitaph_${team.slug}_${index + 1}`, text, true)),
    ],
    shareHooks: makeShareHooks(team.name),
  };
}

export const teamContentPacks: Record<string, TeamContentPack> = Object.fromEntries(
  teams.map((team) => [team.slug, buildContentPack(team)]),
);

export const worldCupTeamSlugs = qualifiedTeams.map(([, slug]) => slug);

const fallbackTeamContentPack = buildContentPack({
  ...teams[0],
  name: "This team",
  slug: "generic",
});

export function getTeamContentPack(teamSlug: string): TeamContentPack {
  return teamContentPacks[teamSlug] ?? fallbackTeamContentPack;
}

export function getCauseOptions(teamSlug: string) {
  return getTeamContentPack(teamSlug).causes.map((cause) => cause.text);
}

export function getEpitaphOptions(teamSlug: string) {
  return getTeamContentPack(teamSlug).epitaphs.map((epitaph) => epitaph.text);
}

export function getShareHooks(teamSlug: string) {
  return getTeamContentPack(teamSlug).shareHooks;
}

export const shareHooks = getShareHooks("italy");

/*
 * Backward-compatible exports used by older tests and pages. New code should use
 * getTeamContentPack so every playable team gets its own paperwork.
 */
export const teamContentPriorities = Object.fromEntries(
  Object.values(teamContentPacks).map((pack) => [pack.teamSlug, pack.priority]),
);

export const teamEpitaphs = Object.fromEntries(
  Object.values(teamContentPacks).map((pack) => [
    pack.teamSlug,
    pack.epitaphs.map((epitaph) => epitaph.text),
  ]),
);

export const teamCauses = Object.fromEntries(
  Object.values(teamContentPacks).map((pack) => [
    pack.teamSlug,
    pack.causes.map((cause) => cause.text),
  ]),
);

/*
 * The Italy arrays remain named because existing tombstones and tests refer to
 * the original early-admission copy.
 */
export const legacyItalyCauses = italyCauses;

export const legacyItalyEpitaphs = italyEpitaphs;

/*
 * Keep the original identifiers available while moving behavior to the team
 * content pack model.
 */
export {
  italyCauses as italyPaperworkCauses,
  italyEpitaphs as italyPaperworkEpitaphs,
};

/*
 * Deprecated aliases retained for older imports.
 */
export const teamSpecificCauses = teamCauses;

export const teamSpecificEpitaphs = teamEpitaphs;

/*
 * End of content model.
 */

/*
 * Legacy block removed: Italy-only content now lives in specialContent. The
 * exports above keep the public API stable for current callers.
 */
/*
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
*/
