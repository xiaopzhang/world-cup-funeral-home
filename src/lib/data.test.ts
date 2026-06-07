import { describe, expect, it } from "vitest";
import {
  createTombstoneRecord,
  getActivityFeed,
  getHomeSnapshot,
  interactWithTombstone,
  leaveTribute,
} from "./demo-store";
import { getCauseOptions, getPlayableTeams, teams } from "./seed-data";

describe("seed data", () => {
  it("makes Italy the only playable early admission team", () => {
    const playable = teams.filter((team) => team.isPlayable);

    expect(playable).toHaveLength(1);
    expect(playable[0]).toMatchObject({
      slug: "italy",
      status: "early_admission",
      admissionType: "early_admission",
    });
  });

  it("sorts homepage teams alphabetically and includes real qualified hosts", () => {
    const snapshot = getHomeSnapshot();
    const names = snapshot.teams.map((team) => team.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).toContain("Canada");
    expect(names).toContain("Mexico");
    expect(names).toContain("United States");
  });

  it("combines generic and Italy-specific cause options", () => {
    const causes = getCauseOptions("italy");

    expect(causes).toContain("Penalty heartbreak");
    expect(causes).toContain("Football royalty denied entry");
  });

  it("returns only playable teams for tombstone creation", () => {
    const playableTeams = getPlayableTeams();

    expect(playableTeams).toHaveLength(1);
    expect(playableTeams.map((team) => team.slug)).toEqual(["italy"]);
  });
});

describe("demo store", () => {
  it("creates tombstones only for playable teams and records activity", () => {
    expect(() =>
      createTombstoneRecord({
        teamSlug: "brazil",
        causeOfDeath: "Penalty heartbreak",
        epitaph: "The dance was beautiful. The ending was not.",
        buriedBy: "Anonymous Fan",
      }),
    ).toThrow("not available");

    const tombstone = createTombstoneRecord({
      teamSlug: "italy",
      causeOfDeath: "Football royalty denied entry",
      epitaph: "Four stars above the badge. No seat at the table.",
      buriedBy: "Udo",
    });

    expect(tombstone.id).toMatch(/^ts_/);
    expect(getHomeSnapshot().activity[0].activityType).toBe("tombstone_created");
  });

  it("increments tombstone and team totals for rituals", () => {
    const tombstone = createTombstoneRecord({
      teamSlug: "italy",
      causeOfDeath: "Four stars, zero invitations",
      epitaph: "The anthem was ready. The invitation was not.",
      buriedBy: "Anonymous Fan",
    });

    const updated = interactWithTombstone(tombstone.id, "flower");
    const italy = getHomeSnapshot().teams.find((team) => team.slug === "italy");

    expect(updated.flowerCount).toBe(1);
    expect(italy?.flowerCount).toBeGreaterThanOrEqual(1);
  });

  it("returns only tombstone creation activity for latest burials", () => {
    const tombstone = createTombstoneRecord({
      teamSlug: "italy",
      causeOfDeath: "Football royalty denied entry",
      epitaph: "Four stars above the badge. No seat at the table.",
      buriedBy: "Udo",
    });

    interactWithTombstone(tombstone.id, "candle");
    leaveTribute(tombstone.id, "The plane was not.", "Udo");

    expect(getActivityFeed().every((item) => item.activityType === "tombstone_created")).toBe(true);
  });
});
