import type { ActivityItem, CauseOption, EpitaphOption, Match, ShareHookSet, Team, TeamContentPack, Tombstone } from "./types";

export const locales = ["en", "es", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment && isLocale(segment) ? segment : defaultLocale;
}

export function getDictionaryForPathname(pathname: string): Dictionary {
  return dictionaries[getLocaleFromPathname(pathname)];
}

export function stripLocalePrefix(pathname: string) {
  const parts = pathname.split("/");
  const firstSegment = parts[1];
  if (firstSegment && isLocale(firstSegment)) {
    const nextPath = `/${parts.slice(2).join("/")}`;
    return nextPath === "/" ? "/" : nextPath.replace(/\/$/, "");
  }
  return pathname || "/";
}

export function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function localizePath(path: string, locale: Locale) {
  const [pathname = "/", query = ""] = path.split("?");
  const cleanPath = stripLocalePrefix(pathname) || "/";
  const localizedPath =
    locale === defaultLocale
      ? cleanPath
      : cleanPath === "/"
        ? localePrefix(locale)
        : `${localePrefix(locale)}${cleanPath}`;
  return query ? `${localizedPath}?${query}` : localizedPath;
}

const teamNameTranslations: Record<Exclude<Locale, "en">, Record<string, string>> = {
  es: {
    algeria: "Argelia",
    argentina: "Argentina",
    australia: "Australia",
    austria: "Austria",
    belgium: "Bélgica",
    "bosnia-and-herzegovina": "Bosnia y Herzegovina",
    brazil: "Brasil",
    "cabo-verde": "Cabo Verde",
    canada: "Canadá",
    colombia: "Colombia",
    "congo-dr": "RD del Congo",
    croatia: "Croacia",
    curacao: "Curazao",
    czechia: "Chequia",
    "cote-divoire": "Costa de Marfil",
    ecuador: "Ecuador",
    egypt: "Egipto",
    england: "Inglaterra",
    france: "Francia",
    germany: "Alemania",
    ghana: "Ghana",
    haiti: "Haití",
    "ir-iran": "Irán",
    iraq: "Irak",
    italy: "Italia",
    japan: "Japón",
    jordan: "Jordania",
    "korea-republic": "República de Corea",
    mexico: "México",
    morocco: "Marruecos",
    netherlands: "Países Bajos",
    "new-zealand": "Nueva Zelanda",
    norway: "Noruega",
    panama: "Panamá",
    paraguay: "Paraguay",
    portugal: "Portugal",
    qatar: "Catar",
    "saudi-arabia": "Arabia Saudita",
    scotland: "Escocia",
    senegal: "Senegal",
    "south-africa": "Sudáfrica",
    spain: "España",
    sweden: "Suecia",
    switzerland: "Suiza",
    tunisia: "Túnez",
    turkiye: "Turquía",
    "united-states": "Estados Unidos",
    uruguay: "Uruguay",
    uzbekistan: "Uzbekistán",
  },
  zh: {
    algeria: "阿尔及利亚",
    argentina: "阿根廷",
    australia: "澳大利亚",
    austria: "奥地利",
    belgium: "比利时",
    "bosnia-and-herzegovina": "波黑",
    brazil: "巴西",
    "cabo-verde": "佛得角",
    canada: "加拿大",
    colombia: "哥伦比亚",
    "congo-dr": "刚果民主共和国",
    croatia: "克罗地亚",
    curacao: "库拉索",
    czechia: "捷克",
    "cote-divoire": "科特迪瓦",
    ecuador: "厄瓜多尔",
    egypt: "埃及",
    england: "英格兰",
    france: "法国",
    germany: "德国",
    ghana: "加纳",
    haiti: "海地",
    "ir-iran": "伊朗",
    iraq: "伊拉克",
    italy: "意大利",
    japan: "日本",
    jordan: "约旦",
    "korea-republic": "韩国",
    mexico: "墨西哥",
    morocco: "摩洛哥",
    netherlands: "荷兰",
    "new-zealand": "新西兰",
    norway: "挪威",
    panama: "巴拿马",
    paraguay: "巴拉圭",
    portugal: "葡萄牙",
    qatar: "卡塔尔",
    "saudi-arabia": "沙特阿拉伯",
    scotland: "苏格兰",
    senegal: "塞内加尔",
    "south-africa": "南非",
    spain: "西班牙",
    sweden: "瑞典",
    switzerland: "瑞士",
    tunisia: "突尼斯",
    turkiye: "土耳其",
    "united-states": "美国",
    uruguay: "乌拉圭",
    uzbekistan: "乌兹别克斯坦",
  },
};

const genericCauseTranslations: Record<Exclude<Locale, "en">, string[]> = {
  es: [
    "Desgarro en los penales",
    "Colapso en el último minuto",
    "Desastre en fase de grupos",
    "Incidente del VAR",
    "Desastre táctico del técnico",
    "Error del portero",
    "El delantero falló todo",
    "Demasiada esperanza antes del saque inicial",
    "Maldición activada",
    "Trauma nacional clásico",
    "Generación dorada caducada",
    "Los dioses del fútbol dijeron que no",
    "Exceso de pensamiento táctico",
    "Daño emocional irreparable",
    "El sistema defensivo desapareció",
    "Drenaje de alma en la prórroga",
    "La esperanza murió antes del pitazo final",
    "El marcador cometió violencia",
  ],
  zh: [
    "点球心碎",
    "最后一分钟崩盘",
    "小组赛灾难",
    "VAR 事故",
    "主教练灾难级表演",
    "门将失误",
    "前锋什么都没进",
    "开球前希望过量",
    "诅咒启动",
    "经典国家队创伤",
    "黄金一代过期",
    "足球之神说不",
    "战术想太多",
    "情绪伤害无法修复",
    "防守体系消失",
    "加时赛灵魂耗尽",
    "终场哨前希望已死",
    "记分牌实施暴力",
  ],
};

const genericCauseEnglish = [
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

const genericEpitaphTranslations: Record<Exclude<Locale, "en">, string[]> = {
  es: [
    "Llegaron con esperanza. El fútbol tramitó el papeleo.",
    "El sueño fue ruidoso. El pitazo final fue más fuerte.",
    "Amados por la hinchada, traicionados por el marcador.",
    "Aquí yace una campaña que necesitaba un milagro más.",
    "Que la repetición nunca los encuentre.",
  ],
  zh: [
    "他们带着希望而来，足球负责办手续。",
    "梦想很响，终场哨更响。",
    "被球迷深爱，被记分牌背叛。",
    "这里安息着一段还差一个奇迹的征程。",
    "愿回放永远找不到他们。",
  ],
};

const genericEpitaphEnglish = [
  "They arrived with hope. Football handled the paperwork.",
  "The dream was loud. The final whistle was louder.",
  "Beloved by fans, betrayed by the scoreboard.",
  "Here lies a campaign that needed one more miracle.",
  "May the replay never find them.",
];

const italyCauseTranslations: Record<Exclude<Locale, "en">, string[]> = {
  es: [
    "Realeza futbolera sin entrada",
    "Cuatro estrellas, cero invitaciones",
    "El Mundial visto desde casa",
    "Recaída del trauma clasificatorio",
    "Desgarro en penales, edición italiana",
    "La Azzurra perdió el autobús",
    "El catenaccio no pudo defender el destino",
    "El himno estaba listo. La invitación, no.",
  ],
  zh: [
    "足球王室被拒之门外",
    "四颗星，零张邀请函",
    "在家看世界杯",
    "预选赛创伤复发",
    "点球心碎，意大利版",
    "蓝衣军团错过了班车",
    "链式防守挡不住命运",
    "国歌准备好了，邀请函没有。",
  ],
};

const italyCauseEnglish = [
  "Football royalty denied entry",
  "Four stars, zero invitations",
  "The World Cup watched from home",
  "Qualification trauma relapse",
  "Penalty heartbreak, Italian edition",
  "The Azzurri missed the bus",
  "Catenaccio couldn't defend destiny",
  "The anthem was ready. The invitation was not.",
];

const italyEpitaphTranslations: Record<Exclude<Locale, "en">, string[]> = {
  es: [
    "Cuatro estrellas sobre el escudo. Ningún asiento en la mesa.",
    "El himno estaba listo. La invitación, no.",
    "Aquí yace un gigante, encerrado fuera de su propio museo.",
    "El catenaccio defendió todo excepto el destino.",
    "Italia no perdió el Mundial. Perdió la puerta de entrada.",
  ],
  zh: [
    "队徽上四颗星，桌边却没有座位。",
    "国歌准备好了，邀请函没有。",
    "这里安息着一位巨人，被锁在自己的博物馆外。",
    "链式防守防住了一切，除了命运。",
    "意大利没有输掉世界杯，它输掉了入口。",
  ],
};

const italyEpitaphEnglish = [
  "Four stars above the badge. No seat at the table.",
  "The anthem was ready. The invitation was not.",
  "Here lies a giant, locked outside its own museum.",
  "Catenaccio defended everything except fate.",
  "Italy didn't lose the World Cup. It lost the doorway.",
];

function baseCauseEnglish(teamName: string) {
  return [
    `${teamName} hope collapsed under tournament gravity`,
    `${teamName} were escorted out by the football gods`,
    `${teamName} vibes failed the knockout stress test`,
    `${teamName} tactical plan met actual consequences`,
    `${teamName} optimism was declared medically unfit`,
    `${teamName} ran out of miracles before stoppage time`,
  ];
}

function baseEpitaphEnglish(teamName: string) {
  return [
    `Here lies ${teamName}, loved loudly and eliminated publicly.`,
    `${teamName} came with belief. The bracket came with receipts.`,
    `May ${teamName}'s fans find peace before the next qualifier.`,
    "The flag still waves. The campaign does not.",
  ];
}

function nonEnglishLocale(locale: Locale): Exclude<Locale, "en"> | null {
  return locale === "en" ? null : locale;
}

export function localizeTeamName(teamSlug: string, fallbackName: string, locale: Locale) {
  const nextLocale = nonEnglishLocale(locale);
  return nextLocale ? teamNameTranslations[nextLocale][teamSlug] ?? fallbackName : fallbackName;
}

export function localizeTeam(team: Team, locale: Locale): Team {
  return {
    ...team,
    name: localizeTeamName(team.slug, team.name, locale),
  };
}

function localizeGenericCause(cause: CauseOption, locale: Exclude<Locale, "en">) {
  const index = Number(cause.id.replace("cause_generic_", "")) - 1;
  return genericCauseTranslations[locale][index] ?? cause.text;
}

function localizeGenericEpitaph(epitaph: EpitaphOption, locale: Exclude<Locale, "en">) {
  const index = Number(epitaph.id.replace("epitaph_generic_", "")) - 1;
  return genericEpitaphTranslations[locale][index] ?? epitaph.text;
}

function baseCauseTranslation(teamName: string, index: number, locale: Exclude<Locale, "en">) {
  const templates = {
    es: [
      `La esperanza de ${teamName} colapsó bajo la gravedad del torneo`,
      `${teamName} fue escoltada fuera por los dioses del fútbol`,
      `Las vibras de ${teamName} fallaron la prueba de estrés eliminatoria`,
      `El plan táctico de ${teamName} conoció las consecuencias reales`,
      `El optimismo de ${teamName} fue declarado médicamente no apto`,
      `${teamName} se quedó sin milagros antes del tiempo añadido`,
    ],
    zh: [
      `${teamName}的希望在赛事重力下崩塌`,
      `${teamName}被足球之神护送出局`,
      `${teamName}的气势没通过淘汰赛压力测试`,
      `${teamName}的战术计划遇到了真实后果`,
      `${teamName}的乐观被判定为医学上不适合继续`,
      `${teamName}在伤停补时前就用完了奇迹`,
    ],
  };
  return templates[locale][index];
}

function baseEpitaphTranslation(teamName: string, index: number, locale: Exclude<Locale, "en">) {
  const templates = {
    es: [
      `Aquí yace ${teamName}, amada a gritos y eliminada en público.`,
      `${teamName} llegó con fe. El cuadro llegó con recibos.`,
      `Que la hinchada de ${teamName} encuentre paz antes de la próxima eliminatoria.`,
      "La bandera sigue ondeando. La campaña no.",
    ],
    zh: [
      `${teamName}安息于此，被热烈地爱着，也被公开地淘汰了。`,
      `${teamName}带着信念而来，签表带着账单而来。`,
      `愿${teamName}的球迷在下一次预选赛前找到平静。`,
      "旗帜还在飘，征程已经不在。",
    ],
  };
  return templates[locale][index];
}

function specialContentTranslation(
  id: string,
  kind: "cause" | "epitaph",
  locale: Exclude<Locale, "en">,
) {
  const italyPrefix = kind === "cause" ? "cause_italy_" : "epitaph_italy_";
  if (!id.startsWith(italyPrefix)) return null;
  const baseCount = kind === "cause" ? 6 : 4;
  const index = Number(id.replace(italyPrefix, "")) - baseCount - 1;
  const translations = kind === "cause" ? italyCauseTranslations : italyEpitaphTranslations;
  return translations[locale][index] ?? null;
}

export function localizeContentPack(pack: TeamContentPack, locale: Locale): TeamContentPack {
  const nextLocale = nonEnglishLocale(locale);
  if (!nextLocale) return pack;

  const teamName = localizeTeamName(pack.teamSlug, pack.teamSlug, locale);
  return {
    ...pack,
    causes: pack.causes.map((cause) => {
      let text = cause.text;
      if (cause.id.startsWith("cause_generic_")) {
        text = localizeGenericCause(cause, nextLocale);
      } else {
        const index = Number(cause.id.replace(`cause_${pack.teamSlug}_`, "")) - 1;
        text =
          index < 6
            ? baseCauseTranslation(teamName, index, nextLocale) ?? cause.text
            : specialContentTranslation(cause.id, "cause", nextLocale) ?? cause.text;
      }
      return { ...cause, text };
    }),
    epitaphs: pack.epitaphs.map((epitaph) => {
      let text = epitaph.text;
      if (epitaph.id.startsWith("epitaph_generic_")) {
        text = localizeGenericEpitaph(epitaph, nextLocale);
      } else {
        const index = Number(epitaph.id.replace(`epitaph_${pack.teamSlug}_`, "")) - 1;
        text =
          index < 4
            ? baseEpitaphTranslation(teamName, index, nextLocale) ?? epitaph.text
            : specialContentTranslation(epitaph.id, "epitaph", nextLocale) ?? epitaph.text;
      }
      return { ...epitaph, text };
    }),
    shareHooks: localizeShareHooks(pack.teamSlug, teamName, nextLocale),
  };
}

export function localizeShareHooks(teamSlug: string, teamName: string, locale: Locale): ShareHookSet {
  const nextLocale = nonEnglishLocale(locale);
  if (!nextLocale) {
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

  const localizedName = localizeTeamName(teamSlug, teamName, nextLocale);
  return nextLocale === "es"
    ? {
        tombstone: [
          `Acabo de enterrar a ${localizedName} en la Funeraria del Mundial.`,
          `${localizedName} rompió mi cuadro, así que le hice una lápida.`,
          `Ven a presentar respetos a ${localizedName}. El fútbol volvió a ser cruel.`,
        ],
        flower: `Dejé flores para ${localizedName}. Ven a despedirla como corresponde.`,
        candle: `Encendí una vela por ${localizedName}. Los dioses del fútbol nos deben respuestas.`,
        incense: `Quemé incienso por ${localizedName}. Que el próximo ciclo duela menos.`,
        tribute: `Dejé un homenaje para ${localizedName}. Es más barato que terapia.`,
      }
    : {
        tombstone: [
          `我刚在世界杯殡仪馆安葬了${localizedName}。`,
          `${localizedName}毁了我的签表，所以我给它立了块墓碑。`,
          `来向${localizedName}致意吧。足球又一次太残酷了。`,
        ],
        flower: `我给${localizedName}献了花。来好好送它一程。`,
        candle: `我为${localizedName}点了蜡烛。足球之神欠我们一个答案。`,
        incense: `我为${localizedName}上了香。愿下个周期少痛一点。`,
        tribute: `我给${localizedName}留了悼词。比心理咨询便宜。`,
      };
}

function localizedTextFromContentId(teamSlug: string, kind: "cause" | "epitaph", text: string, locale: Locale) {
  const nextLocale = nonEnglishLocale(locale);
  if (!nextLocale) return text;

  const englishTexts =
    kind === "cause"
      ? [...genericCauseEnglish, ...baseCauseEnglish("Italy"), ...(teamSlug === "italy" ? italyCauseEnglish : [])]
      : [...genericEpitaphEnglish, ...baseEpitaphEnglish("Italy"), ...(teamSlug === "italy" ? italyEpitaphEnglish : [])];
  const translatedTexts =
    kind === "cause"
      ? [
          ...genericCauseTranslations[nextLocale],
          ...baseCauseEnglish("Italy").map((_, index) =>
            baseCauseTranslation(localizeTeamName(teamSlug, "Italy", locale), index, nextLocale),
          ),
          ...(teamSlug === "italy" ? italyCauseTranslations[nextLocale] : []),
        ]
      : [
          ...genericEpitaphTranslations[nextLocale],
          ...baseEpitaphEnglish("Italy").map((_, index) =>
            baseEpitaphTranslation(localizeTeamName(teamSlug, "Italy", locale), index, nextLocale),
          ),
          ...(teamSlug === "italy" ? italyEpitaphTranslations[nextLocale] : []),
        ];
  const index = englishTexts.indexOf(text);

  return index >= 0
    ? translatedTexts[index]
    : text.replaceAll("Italy", localizeTeamName(teamSlug, "Italy", locale));
}

export function localizeTombstone(tombstone: Tombstone, locale: Locale): Tombstone {
  return {
    ...tombstone,
    causeOfDeath: localizedTextFromContentId(tombstone.teamSlug, "cause", tombstone.causeOfDeath, locale),
    epitaph: localizedTextFromContentId(tombstone.teamSlug, "epitaph", tombstone.epitaph, locale),
  };
}

function parseCreatedActivity(displayText: string) {
  const match = displayText.match(/^(.+) buried (.+)\. Cause of death: (.+)\.$/);
  return match ? { author: match[1], team: match[2], cause: match[3] } : undefined;
}

function parseTributeActivity(displayText: string) {
  const match = displayText.match(/^(.+) left a tribute for (.+): "(.*)"$/);
  return match ? { author: match[1], team: match[2], tribute: match[3] } : undefined;
}

export function localizeActivityItem(item: ActivityItem, locale: Locale): ActivityItem {
  if (locale === "en") return item;

  const teamName = localizeTeamName(item.teamSlug, item.teamSlug, locale);

  if (item.activityType === "tombstone_created") {
    const parsed = parseCreatedActivity(item.displayText);
    const cause = parsed?.cause
      ? localizedTextFromContentId(item.teamSlug, "cause", parsed.cause, locale)
      : "";
    return {
      ...item,
      displayText:
        locale === "es"
          ? `${parsed?.author ?? "Alguien"} enterró a ${teamName}. Causa de muerte: ${cause}.`
          : `${parsed?.author ?? "有人"} 安葬了${teamName}。死因：${cause}。`,
    };
  }

  if (item.activityType === "flower_offered") {
    return {
      ...item,
      displayText: locale === "es" ? `Alguien dejó flores para ${teamName}.` : `有人为${teamName}献了花。`,
    };
  }

  if (item.activityType === "candle_lit") {
    return {
      ...item,
      displayText: locale === "es" ? `Alguien encendió una vela por ${teamName}.` : `有人为${teamName}点了蜡烛。`,
    };
  }

  if (item.activityType === "incense_burned") {
    return {
      ...item,
      displayText: locale === "es" ? `Alguien quemó incienso por ${teamName}.` : `有人为${teamName}上了香。`,
    };
  }

  if (item.activityType === "tribute_left") {
    const parsed = parseTributeActivity(item.displayText);
    return {
      ...item,
      displayText:
        locale === "es"
          ? `${parsed?.author ?? "Alguien"} dejó un homenaje para ${teamName}: "${parsed?.tribute ?? ""}"`
          : `${parsed?.author ?? "有人"} 为${teamName}留下悼词：“${parsed?.tribute ?? ""}”`,
    };
  }

  return {
    ...item,
    displayText: item.displayText.replaceAll("Italy", teamName),
  };
}

export function localizeMatch(match: Match, locale: Locale): Match {
  if (locale === "en") return match;
  if (match.id === "match_italy_early_admission") {
    return locale === "es"
      ? {
          ...match,
          stage: "Final del repechaje europeo",
          venue: "Sala de espera de la clasificación",
          teamA: "Bosnia y Herzegovina",
          teamB: "Italia",
          penaltyScore: "Bosnia y Herzegovina ganó en penales",
          displayText:
            "Partido de muerte: Bosnia y Herzegovina 1-1 Italia. Bosnia y Herzegovina ganó en penales. Final del repechaje europeo.",
          broadcastText: "Italia no murió en el Mundial. Murió intentando conseguir invitación.",
        }
      : {
          ...match,
          stage: "欧洲区预选赛附加赛决赛",
          venue: "资格等待室",
          teamA: "波黑",
          teamB: "意大利",
          penaltyScore: "波黑点球获胜",
          displayText: "死亡之战：波黑 1-1 意大利。波黑点球获胜。欧洲区预选赛附加赛决赛。",
          broadcastText: "意大利不是死在世界杯上，而是死在试图拿到邀请函的路上。",
        };
  }
  return {
    ...match,
    teamA: localizeTeamName(match.winnerTeamSlug === match.teamA ? match.winnerTeamSlug : "", match.teamA, locale),
    teamB: localizeTeamName(match.loserTeamSlug === match.teamB ? match.loserTeamSlug : "", match.teamB, locale),
  };
}

export const dictionaries = {
  en: {
    languageName: "English",
    header: {
      teamWall: "Team Wall",
      feed: "Latest Burials",
      create: "Build a Tombstone",
      closeMenu: "Close menu",
      openMenu: "Open menu",
    },
    footer: {
      eyebrow: "Independent football grief department",
      title: "Keep the Funeral Home online",
      body: "This site runs on servers, databases, APIs, and irresponsible football grief. If it made you laugh, you can help keep it online by buying us a coffee.",
      paypal: "Buy us a coffee with PayPal",
      paypalSoon: "PayPal link coming soon",
      supportNote: "Support is optional. The football mourning remains free.",
      built: "Built for football pain, shared for free.",
      supportItems: ["Server hosting", "Match data APIs", "Shareable tombstones"],
    },
    common: {
      siteName: "World Cup Funeral Home",
      flowers: "Flowers",
      candles: "Candles",
      incense: "Incense",
      tombstones: "Tombstones",
      tombs: "Tombs",
      inMemory: "In Loving Memory of",
      causeOfDeath: "Cause of Death",
      buriedBy: "Buried by",
      backToTeamWall: "Back to Team Wall",
      buildTombstone: "Build a Tombstone",
      visitTombstone: "Visit Tombstone",
      italyFlag: "Italy flag",
    },
    home: {
      description: "Create and share satirical tombstones for eliminated World Cup teams.",
      heroBody: "A funeral home for eliminated teams, broken dreams, and emotionally damaged football fans.",
      heroNote: "Gray flags are still alive. Full-color flags are ready for burial. Italy arrived early.",
      latestBurials: "Latest Burials",
      viewLatest: "View Latest Burials",
      earlyAdmission: "Early Admission",
      italyHere: "Italy is already here.",
      italyEpitaph: "The anthem was ready. The invitation was not.",
      paperwork: "Build the paperwork",
      wallTitle: "The Wall of the Living and the Fallen",
      wallBody: "qualified teams are still breathing. Italy did the paperwork early.",
      openFeed: "Open Feed",
      emptyLatest: "No burials yet. Italy is waiting with a very dramatic clipboard.",
    },
    teamCard: {
      earlyAdmission: "Early Admission",
      eliminated: "Eliminated",
      alive: "Still alive",
      playable: "Arrived early. Not at the World Cup. At the Funeral Home.",
      unavailable: "Not admitted yet. This team is still alive.",
      unavailableButton: "Not available yet",
      unavailableTitle: "This team is still alive. Please do not arrange the funeral too early.",
    },
    tombstoneCard: {
      buriedBy: "Buried by",
    },
    create: {
      title: "Build a Tombstone",
      description: "Create a shareable World Cup Funeral Home tombstone for Italy and future eliminated football teams.",
      loading: "Loading funeral paperwork...",
      intro: "Choose a fallen team. Pick the cause. Carve the epitaph. Sign the stone.",
      noTeamTitle: "No team is ready for burial.",
      noTeamBody: "The Funeral Home opens when a team has been eliminated.",
      steps: ["Choose Team", "Cause", "Epitaph", "Preview"],
      stepCounter: "Step",
      of: "of",
      teamOpen: "The Funeral Home is open.",
      causeTitle: "Choose a Cause of Death",
      causeBody: "Pick one from the official paperwork, or write your own.",
      genericCauses: "Generic Causes",
      teamPaperwork: "Paperwork",
      customCause: "Write a more painful cause of death...",
      causeHint: "Be funny. Be cruel to the football. Not to real people.",
      epitaphTitle: "Choose an Epitaph",
      epitaphBody: "Pick a final line, or carve your own.",
      customEpitaph: "Write the final line this team deserves...",
      signature: "Your name or nickname",
      signatureHint: "Required. Keep it about football trauma. Don’t attack real people.",
      previewTitle: "Preview Tombstone",
      buriedBy: "Buried by:",
      edit: "Edit",
      continue: "Continue",
      publishing: "Publishing...",
      publish: "Publish Tombstone",
      guardrail: "No links. No hate speech. No attacks on real people. Just football pain in a nice stone jacket.",
      aliveError: "This team is still alive. Funeral paperwork is not accepted yet.",
      publishError: "Unable to publish tombstone.",
    },
    feed: {
      title: "Latest Burials",
      description: "Browse the newest World Cup Funeral Home tombstones and pay respects to eliminated football teams.",
      boardTitle: "Funeral Notice Board",
      boardBody: "The latest tombstones only, so fans can find the best paperwork without wading through every candle.",
      emptyTitle: "The notice board is empty.",
      emptyBody: "Be the first fan to make Italy’s paperwork public.",
    },
    detail: {
      notFoundTitle: "Tombstone Not Found",
      notFoundBody: "The paperwork may have been lost in extra time.",
      loading: "Loading tombstone...",
      respectsHere: "Pay respects here",
      respectsCount: "fans have already paid their respects.",
      offerFlowers: "Offer Flowers",
      lightCandle: "Light a Candle",
      burnIncense: "Burn Incense",
      shareTombstone: "Share Tombstone",
      preparingPoster: "Preparing Poster...",
      downloadPoster: "Download Share Poster",
      downloadPosterHidden: "Download poster",
      buildOwn: "Build Your Own Tombstone",
      reportTombstone: "Report this tombstone",
      shareText: "Share Text",
      readyTitle: "The tombstone is ready.",
      readyBody: "Want to invite other fans to pay their respects?",
      share: "Share",
      continueMourning: "Continue Mourning",
      sidebarBuildTitle: "Build your own tombstone",
      sidebarBuildBody: "Send another fallen team to the Funeral Home.",
      received: "This tombstone has received",
      teamStats: "Italy-wide mourning stats",
      leaveTribute: "Leave a Tribute",
      tributePlaceholder: "Write something painful, funny, or emotionally unstable...",
      authorPlaceholder: "Your name or Anonymous Fan",
      tributeHint: "Keep it about football trauma. Don’t attack real people.",
      sending: "Sending...",
      tributeWall: "Tribute Wall",
      hot: "Hot",
      newest: "Newest",
      by: "By",
      score: "Score",
      report: "Report",
      noTributes: "No tributes yet. Everyone is still staring at the qualification table.",
      feedback: {
        flower: "Flowers offered. Dignity for the team. Emotional damage for the fans.",
        candle: "Candle lit. May they find their way back in 2030.",
        incense: "Incense burned. May the football gods answer someday.",
      },
      ritualError: "The ritual paperwork jammed.",
      tributeReceived: "Tribute received. Cheaper than therapy.",
      tributeRejected: "Tribute rejected by the paperwork desk.",
      tributeLiked: "Tribute liked.",
      tributeDisliked: "Tribute disliked.",
      voteRejected: "Vote rejected by the paperwork desk.",
      reviewTombstonePrompt: "Why should this tombstone be reviewed?",
      reviewTributePrompt: "Why should this tribute be reviewed?",
      reviewDefault: "Off-topic or inappropriate football funeral content",
      reportReceived: "Report received. The funeral desk will review it.",
      reportFailed: "Unable to receive report.",
      shareOpened: "Share sheet opened. Bring more fans to the funeral.",
      shareCopied: "Share hook copied. Bring more fans to the funeral.",
      shareManual: "Sharing needs a manual pass in this browser. Copy the text below.",
      preparingPosterMessage: "Preparing poster...",
      posterOpened: "Poster opened in a new tab. Save the image from there.",
      posterDownloaded: "Poster downloaded. You can download it again anytime. If it does not download again, refresh the page and try once more.",
      posterFailed: "Poster download failed. Please try again.",
    },
  },
  es: {
    languageName: "Español",
    header: {
      teamWall: "Muro de equipos",
      feed: "Últimos entierros",
      create: "Crear lápida",
      closeMenu: "Cerrar menú",
      openMenu: "Abrir menú",
    },
    footer: {
      eyebrow: "Departamento independiente de duelo futbolero",
      title: "Mantén abierta la funeraria",
      body: "Este sitio vive de servidores, bases de datos, APIs y duelo futbolero irresponsable. Si te hizo reír, puedes ayudarnos con un café.",
      paypal: "Invítanos un café con PayPal",
      paypalSoon: "Enlace de PayPal próximamente",
      supportNote: "El apoyo es opcional. El luto futbolero sigue siendo gratis.",
      built: "Hecho para el dolor futbolero, compartido gratis.",
      supportItems: ["Alojamiento del servidor", "APIs de partidos", "Lápidas compartibles"],
    },
    common: {
      siteName: "Funeraria del Mundial",
      flowers: "Flores",
      candles: "Velas",
      incense: "Incienso",
      tombstones: "Lápidas",
      tombs: "Tumbas",
      inMemory: "En memoria de",
      causeOfDeath: "Causa de muerte",
      buriedBy: "Enterrado por",
      backToTeamWall: "Volver al muro",
      buildTombstone: "Crear lápida",
      visitTombstone: "Visitar lápida",
      italyFlag: "Bandera de Italia",
    },
    home: {
      description: "Crea y comparte lápidas satíricas para selecciones eliminadas del Mundial.",
      heroBody: "Una funeraria para selecciones eliminadas, sueños rotos y hinchas emocionalmente dañados.",
      heroNote: "Las banderas grises siguen vivas. Las de color ya están listas para el entierro. Italia llegó temprano.",
      latestBurials: "Últimos entierros",
      viewLatest: "Ver últimos entierros",
      earlyAdmission: "Ingreso anticipado",
      italyHere: "Italia ya está aquí.",
      italyEpitaph: "El himno estaba listo. La invitación, no.",
      paperwork: "Preparar el papeleo",
      wallTitle: "El muro de vivos y caídos",
      wallBody: "selecciones clasificadas siguen respirando. Italia hizo el papeleo temprano.",
      openFeed: "Abrir tablón",
      emptyLatest: "Aún no hay entierros. Italia espera con un portapapeles muy dramático.",
    },
    teamCard: {
      earlyAdmission: "Ingreso anticipado",
      eliminated: "Eliminada",
      alive: "Sigue viva",
      playable: "Llegó temprano. No al Mundial. A la funeraria.",
      unavailable: "Aún no admitida. Esta selección sigue viva.",
      unavailableButton: "No disponible aún",
      unavailableTitle: "Esta selección sigue viva. No prepares el funeral demasiado pronto.",
    },
    tombstoneCard: {
      buriedBy: "Enterrado por",
    },
    create: {
      title: "Crear lápida",
      description: "Crea una lápida compartible para Italia y futuras selecciones eliminadas.",
      loading: "Cargando papeleo funerario...",
      intro: "Elige una selección caída. Escoge la causa. Graba el epitafio. Firma la piedra.",
      noTeamTitle: "Ninguna selección está lista para el entierro.",
      noTeamBody: "La funeraria abre cuando una selección queda eliminada.",
      steps: ["Elegir equipo", "Causa", "Epitafio", "Vista previa"],
      stepCounter: "Paso",
      of: "de",
      teamOpen: "La funeraria está abierta.",
      causeTitle: "Elegir causa de muerte",
      causeBody: "Escoge una del papeleo oficial o escribe la tuya.",
      genericCauses: "Causas genéricas",
      teamPaperwork: "Papeleo",
      customCause: "Escribe una causa de muerte más dolorosa...",
      causeHint: "Sé gracioso. Sé cruel con el fútbol. No con personas reales.",
      epitaphTitle: "Elegir epitafio",
      epitaphBody: "Escoge una frase final o graba la tuya.",
      customEpitaph: "Escribe la última frase que este equipo merece...",
      signature: "Tu nombre o apodo",
      signatureHint: "Obligatorio. Mantén el trauma en el fútbol. No ataques a personas reales.",
      previewTitle: "Vista previa de la lápida",
      buriedBy: "Enterrado por:",
      edit: "Editar",
      continue: "Continuar",
      publishing: "Publicando...",
      publish: "Publicar lápida",
      guardrail: "Sin enlaces. Sin odio. Sin ataques a personas reales. Solo dolor futbolero en piedra elegante.",
      aliveError: "Esta selección sigue viva. La funeraria aún no acepta su papeleo.",
      publishError: "No se pudo publicar la lápida.",
    },
    feed: {
      title: "Últimos entierros",
      description: "Explora las lápidas más recientes y presenta respetos a selecciones eliminadas.",
      boardTitle: "Tablón de avisos funerarios",
      boardBody: "Solo las lápidas más recientes, para encontrar el mejor papeleo sin atravesar todas las velas.",
      emptyTitle: "El tablón está vacío.",
      emptyBody: "Sé el primer hincha en publicar el papeleo de Italia.",
    },
    detail: {
      notFoundTitle: "Lápida no encontrada",
      notFoundBody: "Puede que el papeleo se perdiera en la prórroga.",
      loading: "Cargando lápida...",
      respectsHere: "Presenta tus respetos aquí",
      respectsCount: "hinchas ya presentaron sus respetos.",
      offerFlowers: "Ofrecer flores",
      lightCandle: "Encender vela",
      burnIncense: "Quemar incienso",
      shareTombstone: "Compartir lápida",
      preparingPoster: "Preparando póster...",
      downloadPoster: "Descargar póster",
      downloadPosterHidden: "Descargar póster",
      buildOwn: "Crear tu propia lápida",
      reportTombstone: "Reportar esta lápida",
      shareText: "Texto para compartir",
      readyTitle: "La lápida está lista.",
      readyBody: "¿Quieres invitar a otros hinchas a presentar sus respetos?",
      share: "Compartir",
      continueMourning: "Seguir de luto",
      sidebarBuildTitle: "Crea tu propia lápida",
      sidebarBuildBody: "Envía otra selección caída a la funeraria.",
      received: "Esta lápida ha recibido",
      teamStats: "Estadísticas de duelo de Italia",
      leaveTribute: "Dejar homenaje",
      tributePlaceholder: "Escribe algo doloroso, gracioso o emocionalmente inestable...",
      authorPlaceholder: "Tu nombre o Hincha anónimo",
      tributeHint: "Mantén el trauma en el fútbol. No ataques a personas reales.",
      sending: "Enviando...",
      tributeWall: "Muro de homenajes",
      hot: "Populares",
      newest: "Nuevos",
      by: "Por",
      score: "Puntaje",
      report: "Reportar",
      noTributes: "Aún no hay homenajes. Todos siguen mirando la tabla de clasificación.",
      feedback: {
        flower: "Flores ofrecidas. Dignidad para el equipo. Daño emocional para los hinchas.",
        candle: "Vela encendida. Que encuentren el camino de vuelta en 2030.",
        incense: "Incienso quemado. Que los dioses del fútbol respondan algún día.",
      },
      ritualError: "El papeleo del ritual se atascó.",
      tributeReceived: "Homenaje recibido. Más barato que terapia.",
      tributeRejected: "Homenaje rechazado por el escritorio de papeleo.",
      tributeLiked: "Homenaje marcado como favorito.",
      tributeDisliked: "Homenaje rechazado.",
      voteRejected: "Voto rechazado por el escritorio de papeleo.",
      reviewTombstonePrompt: "¿Por qué debe revisarse esta lápida?",
      reviewTributePrompt: "¿Por qué debe revisarse este homenaje?",
      reviewDefault: "Contenido funerario futbolero fuera de tema o inapropiado",
      reportReceived: "Reporte recibido. La mesa funeraria lo revisará.",
      reportFailed: "No se pudo recibir el reporte.",
      shareOpened: "Hoja para compartir abierta. Trae más hinchas al funeral.",
      shareCopied: "Texto copiado. Trae más hinchas al funeral.",
      shareManual: "Este navegador necesita compartir manualmente. Copia el texto abajo.",
      preparingPosterMessage: "Preparando póster...",
      posterOpened: "Póster abierto en una pestaña nueva. Guarda la imagen desde allí.",
      posterDownloaded: "Póster descargado. Puedes descargarlo otra vez cuando quieras. Si no vuelve a bajar, actualiza la página e inténtalo de nuevo.",
      posterFailed: "Falló la descarga del póster. Inténtalo de nuevo.",
    },
  },
  zh: {
    languageName: "中文",
    header: {
      teamWall: "球队墙",
      feed: "最新下葬",
      create: "立墓碑",
      closeMenu: "关闭菜单",
      openMenu: "打开菜单",
    },
    footer: {
      eyebrow: "独立足球悲伤部门",
      title: "让世界杯殡仪馆继续营业",
      body: "这个网站靠服务器、数据库、接口和不太负责的足球悲伤运转。如果它逗笑了你，可以请我们喝杯咖啡。",
      paypal: "用 PayPal 请我们喝咖啡",
      paypalSoon: "PayPal 链接即将上线",
      supportNote: "支持完全自愿。足球哀悼永久免费。",
      built: "为足球伤痛而建，免费分享。",
      supportItems: ["服务器托管", "比赛数据接口", "可分享墓碑"],
    },
    common: {
      siteName: "世界杯殡仪馆",
      flowers: "鲜花",
      candles: "蜡烛",
      incense: "香火",
      tombstones: "墓碑",
      tombs: "墓碑",
      inMemory: "谨以此纪念",
      causeOfDeath: "死因",
      buriedBy: "下葬人",
      backToTeamWall: "返回球队墙",
      buildTombstone: "立墓碑",
      visitTombstone: "查看墓碑",
      italyFlag: "意大利国旗",
    },
    home: {
      description: "为世界杯出局球队创建并分享讽刺墓碑。",
      heroBody: "献给出局球队、破碎梦想和情绪受损球迷的殡仪馆。",
      heroNote: "灰色旗帜还活着。彩色旗帜已经可以下葬。意大利提前到了。",
      latestBurials: "最新下葬",
      viewLatest: "查看最新下葬",
      earlyAdmission: "提前入住",
      italyHere: "意大利已经到了。",
      italyEpitaph: "国歌准备好了，邀请函没有。",
      paperwork: "办理手续",
      wallTitle: "生者与倒下者之墙",
      wallBody: "支晋级球队还在喘气。意大利提前把手续办了。",
      openFeed: "打开动态",
      emptyLatest: "还没有下葬。意大利正拿着非常戏剧化的夹板等待。",
    },
    teamCard: {
      earlyAdmission: "提前入住",
      eliminated: "已淘汰",
      alive: "还活着",
      playable: "来早了。不是去世界杯，是来殡仪馆。",
      unavailable: "暂未接收。这支球队还活着。",
      unavailableButton: "暂不可用",
      unavailableTitle: "这支球队还活着。请不要太早安排葬礼。",
    },
    tombstoneCard: {
      buriedBy: "下葬人",
    },
    create: {
      title: "立墓碑",
      description: "为意大利和未来出局的球队创建可分享的世界杯殡仪馆墓碑。",
      loading: "正在加载葬礼手续...",
      intro: "选择倒下的球队。挑死因。刻墓志铭。签名落款。",
      noTeamTitle: "还没有球队可以下葬。",
      noTeamBody: "有球队出局后，殡仪馆才会开门。",
      steps: ["选择球队", "死因", "墓志铭", "预览"],
      stepCounter: "第",
      of: "步，共",
      teamOpen: "殡仪馆已开放。",
      causeTitle: "选择死因",
      causeBody: "从官方手续里挑一个，或者自己写。",
      genericCauses: "通用死因",
      teamPaperwork: "专属手续",
      customCause: "写一个更痛的死因...",
      causeHint: "可以好笑。可以对足球残忍。不要攻击真实的人。",
      epitaphTitle: "选择墓志铭",
      epitaphBody: "挑一句最终悼词，或者亲手刻一句。",
      customEpitaph: "写下这支球队应得的最后一句话...",
      signature: "你的名字或昵称",
      signatureHint: "必填。只聊足球创伤，不攻击真实的人。",
      previewTitle: "预览墓碑",
      buriedBy: "下葬人：",
      edit: "编辑",
      continue: "继续",
      publishing: "发布中...",
      publish: "发布墓碑",
      guardrail: "不要链接。不要仇恨言论。不要攻击真实的人。只把足球伤痛优雅地刻进石头。",
      aliveError: "这支球队还活着。殡仪馆暂不受理手续。",
      publishError: "无法发布墓碑。",
    },
    feed: {
      title: "最新下葬",
      description: "浏览最新的世界杯殡仪馆墓碑，并向出局球队致意。",
      boardTitle: "葬礼公告板",
      boardBody: "这里只放最新墓碑，让球迷不用穿过满地蜡烛也能找到最佳手续。",
      emptyTitle: "公告板还是空的。",
      emptyBody: "成为第一个公开意大利手续的球迷。",
    },
    detail: {
      notFoundTitle: "未找到墓碑",
      notFoundBody: "手续可能在加时赛里丢了。",
      loading: "正在加载墓碑...",
      respectsHere: "在这里致意",
      respectsCount: "位球迷已经致意。",
      offerFlowers: "献花",
      lightCandle: "点蜡烛",
      burnIncense: "上香",
      shareTombstone: "分享墓碑",
      preparingPoster: "正在准备海报...",
      downloadPoster: "下载分享海报",
      downloadPosterHidden: "下载海报",
      buildOwn: "创建你的墓碑",
      reportTombstone: "举报这块墓碑",
      shareText: "分享文案",
      readyTitle: "墓碑已准备好。",
      readyBody: "要邀请其他球迷来致意吗？",
      share: "分享",
      continueMourning: "继续哀悼",
      sidebarBuildTitle: "创建自己的墓碑",
      sidebarBuildBody: "把另一支倒下的球队送进殡仪馆。",
      received: "这块墓碑已收到",
      teamStats: "意大利全馆哀悼数据",
      leaveTribute: "留下悼词",
      tributePlaceholder: "写点痛的、好笑的，或者情绪不太稳定的东西...",
      authorPlaceholder: "你的名字或匿名球迷",
      tributeHint: "只聊足球创伤，不攻击真实的人。",
      sending: "发送中...",
      tributeWall: "悼词墙",
      hot: "热门",
      newest: "最新",
      by: "来自",
      score: "分数",
      report: "举报",
      noTributes: "还没有悼词。大家还在盯着积分表发呆。",
      feedback: {
        flower: "鲜花已献上。球队得到尊严，球迷得到情绪伤害。",
        candle: "蜡烛已点燃。愿他们 2030 找到回来的路。",
        incense: "香已上。愿足球之神有一天回应。",
      },
      ritualError: "仪式手续卡住了。",
      tributeReceived: "悼词已收到。比心理咨询便宜。",
      tributeRejected: "悼词被手续台拒收。",
      tributeLiked: "已点赞悼词。",
      tributeDisliked: "已点踩悼词。",
      voteRejected: "投票被手续台拒收。",
      reviewTombstonePrompt: "为什么这块墓碑需要审核？",
      reviewTributePrompt: "为什么这条悼词需要审核？",
      reviewDefault: "偏题或不合适的足球葬礼内容",
      reportReceived: "举报已收到。殡仪馆前台会审核。",
      reportFailed: "无法接收举报。",
      shareOpened: "分享面板已打开。带更多球迷来参加葬礼。",
      shareCopied: "分享文案已复制。带更多球迷来参加葬礼。",
      shareManual: "这个浏览器需要手动分享。复制下面的文字。",
      preparingPosterMessage: "正在准备海报...",
      posterOpened: "海报已在新标签页打开。请在那里保存图片。",
      posterDownloaded: "海报已下载。你可以随时再次下载。如果不能重复下载，请刷新页面再试。",
      posterFailed: "海报下载失败。请再试一次。",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
