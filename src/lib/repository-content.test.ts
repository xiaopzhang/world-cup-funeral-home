import { describe, expect, it } from "vitest";
import { getContentOptions, getCreateOptions } from "./repository";

describe("repository content options", () => {
  it("falls back to local content packs without Supabase", async () => {
    await expect(getContentOptions("brazil")).resolves.toMatchObject({
      teamSlug: "brazil",
      priority: "hot",
    });
  });

  it("includes content packs in create options", async () => {
    const options = await getCreateOptions();

    expect(options.teams.map((team) => team.slug)).toEqual(["italy"]);
    expect(options.content.italy.causes.length).toBeGreaterThan(8);
    expect(options.content.italy.epitaphs.length).toBeGreaterThan(5);
  });
});
