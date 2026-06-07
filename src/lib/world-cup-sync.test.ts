import { describe, expect, it } from "vitest";
import {
  applyWorldCupMatchEvents,
  normalizeFootballDataMatch,
  shouldRunCron,
} from "./world-cup-sync";
import type { Team } from "./types";

const team = (slug: string, name: string): Team => ({
  id: `team_${slug}`,
  name,
  slug,
  countryCode: slug.slice(0, 2),
  flagUrl: `https://flagcdn.com/w160/${slug.slice(0, 2)}.png`,
  status: "alive",
  admissionType: "world_cup_elimination",
  isPlayable: false,
  eliminatedAt: null,
  deathMatchId: null,
  tombstoneCount: 0,
  flowerCount: 0,
  candleCount: 0,
  incenseCount: 0,
  tributeCount: 0,
});

describe("world cup sync", () => {
  it("normalizes a finished knockout match into an elimination event", () => {
    const event = normalizeFootballDataMatch({
      id: 88,
      utcDate: "2026-07-04T20:00:00Z",
      stage: "LAST_16",
      status: "FINISHED",
      homeTeam: { id: 1, name: "Brazil" },
      awayTeam: { id: 2, name: "Germany" },
      score: {
        winner: "HOME_TEAM",
        fullTime: { home: 2, away: 1 },
        penalties: { home: null, away: null },
      },
    });

    expect(event).toMatchObject({
      providerMatchId: "football-data:88",
      loserName: "Germany",
      winnerName: "Brazil",
      stage: "LAST_16",
      status: "final",
    });
  });

  it("does not publish when a provider match is missing a final winner", () => {
    const event = normalizeFootballDataMatch({
      id: 89,
      utcDate: "2026-07-04T20:00:00Z",
      stage: "LAST_16",
      status: "FINISHED",
      homeTeam: { id: 1, name: "Brazil" },
      awayTeam: { id: 2, name: "Germany" },
      score: { winner: null, fullTime: { home: 1, away: 1 } },
    });

    expect(event).toBeNull();
  });

  it("updates the losing team as playable and records an audit event", () => {
    const result = applyWorldCupMatchEvents({
      teams: [team("brazil", "Brazil"), team("germany", "Germany")],
      existingProviderMatchIds: new Set(),
      events: [
        {
          providerMatchId: "football-data:88",
          provider: "football-data",
          stage: "LAST_16",
          date: "2026-07-04",
          status: "final",
          homeName: "Brazil",
          awayName: "Germany",
          winnerName: "Brazil",
          loserName: "Germany",
          homeScore: 2,
          awayScore: 1,
          penaltyScore: null,
          rawHash: "hash",
        },
      ],
    });

    expect(result.teamUpdates).toEqual([
      expect.objectContaining({
        slug: "germany",
        status: "eliminated",
        isPlayable: true,
      }),
    ]);
    expect(result.statusEvents[0]?.reason).toContain("Germany were eliminated");
  });

  it("requires the configured cron secret", () => {
    expect(shouldRunCron("secret", "Bearer secret")).toBe(true);
    expect(shouldRunCron("secret", "Bearer wrong")).toBe(false);
    expect(shouldRunCron("", "Bearer anything")).toBe(false);
  });
});
