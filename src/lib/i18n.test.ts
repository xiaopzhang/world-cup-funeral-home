import { describe, expect, it } from "vitest";
import {
  dictionaries,
  getDictionaryForPathname,
  getLocaleFromPathname,
  localizeContentPack,
  localizeMatch,
  localizePath,
  localizeActivityItem,
  localizeTeam,
  localizeTombstone,
} from "./i18n";
import { getTeamContentPack, italyDeathMatch, teams } from "./seed-data";
import type { ActivityItem, Tombstone } from "./types";

describe("i18n routing", () => {
  it("keeps English on root paths and prefixes Spanish and Chinese paths", () => {
    expect(localizePath("/", "en")).toBe("/");
    expect(localizePath("/feed", "en")).toBe("/feed");
    expect(localizePath("/feed", "es")).toBe("/es/feed");
    expect(localizePath("/create?team=italy", "zh")).toBe("/zh/create?team=italy");
  });

  it("replaces an existing locale prefix when switching languages", () => {
    expect(localizePath("/es/tombstone/italy-1", "zh")).toBe("/zh/tombstone/italy-1");
    expect(localizePath("/zh/feed", "en")).toBe("/feed");
  });

  it("recognizes supported locale prefixes and exposes localized navigation copy", () => {
    expect(getLocaleFromPathname("/es/create")).toBe("es");
    expect(getLocaleFromPathname("/zh/tombstone/abc")).toBe("zh");
    expect(getLocaleFromPathname("/create")).toBe("en");
    expect(dictionaries.es.header.feed).toBe("Últimos entierros");
    expect(dictionaries.zh.header.create).toBe("立墓碑");
  });

  it("selects the dictionary from the current pathname for persistent shell UI", () => {
    expect(getDictionaryForPathname("/es/feed").footer.title).toBe("Mantén abierta la funeraria");
    expect(getDictionaryForPathname("/zh").footer.title).toBe("让世界杯殡仪馆继续营业");
    expect(getDictionaryForPathname("/").footer.title).toBe("Keep the Funeral Home online");
  });

  it("localizes prepared team names, causes, epitaphs, and match copy", () => {
    const italy = teams.find((team) => team.slug === "italy")!;
    const spanishPack = localizeContentPack(getTeamContentPack("italy"), "es");
    const chinesePack = localizeContentPack(getTeamContentPack("italy"), "zh");

    expect(localizeTeam(italy, "es").name).toBe("Italia");
    expect(localizeTeam(italy, "zh").name).toBe("意大利");
    expect(spanishPack.causes.map((item) => item.text)).toContain("Cuatro estrellas, cero invitaciones");
    expect(spanishPack.epitaphs.map((item) => item.text)).toContain("El himno estaba listo. La invitación, no.");
    expect(chinesePack.causes.map((item) => item.text)).toContain("四颗星，零张邀请函");
    expect(chinesePack.epitaphs.map((item) => item.text)).toContain("国歌准备好了，邀请函没有。");
    expect(localizeMatch(italyDeathMatch, "zh").displayText).toContain("意大利");
  });

  it("localizes existing tombstones when their text matches prepared copy", () => {
    const tombstone: Tombstone = {
      id: "ts_1",
      teamSlug: "italy",
      deathMatchId: italyDeathMatch.id,
      causeOfDeath: "Football royalty denied entry",
      epitaph: "Four stars above the badge. No seat at the table.",
      buriedBy: "Fan",
      createdAt: "2026-06-10T10:00:00Z",
      shareSlug: "italy-test",
      flowerCount: 0,
      candleCount: 0,
      incenseCount: 0,
      tributeCount: 0,
      isPublic: true,
      moderationStatus: "approved",
    };

    expect(localizeTombstone(tombstone, "es").causeOfDeath).toBe("Realeza futbolera sin entrada");
    expect(localizeTombstone(tombstone, "zh").epitaph).toBe("队徽上四颗星，桌边却没有座位。");
  });

  it("localizes feed activity text instead of showing stored English display copy", () => {
    const activity: ActivityItem = {
      id: "act_1",
      activityType: "tombstone_created",
      teamSlug: "italy",
      tombstoneId: "italy-test",
      tributeId: null,
      interactionType: null,
      displayText: "Ash buried Italy. Cause of death: Penalty heartbreak.",
      createdAt: "2026-06-10T10:00:00Z",
    };

    expect(localizeActivityItem(activity, "es").displayText).toBe(
      "Ash enterró a Italia. Causa de muerte: Desgarro en los penales.",
    );
    expect(localizeActivityItem(activity, "zh").displayText).toBe("Ash 安葬了意大利。死因：点球心碎。");
  });

  it("localizes feed activity text for generated base team causes", () => {
    const activity: ActivityItem = {
      id: "act_2",
      activityType: "tombstone_created",
      teamSlug: "italy",
      tombstoneId: "italy-test-2",
      tributeId: null,
      interactionType: null,
      displayText: "Udo buried Italy. Cause of death: Italy vibes failed the knockout stress test.",
      createdAt: "2026-06-10T10:00:00Z",
    };

    expect(localizeActivityItem(activity, "es").displayText).toBe(
      "Udo enterró a Italia. Causa de muerte: Las vibras de Italia fallaron la prueba de estrés eliminatoria.",
    );
  });
});
