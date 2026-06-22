import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n";
import type { Team } from "@/lib/types";
import { TeamCard } from "./team-card";

const baseTeam: Team = {
  id: "team_brazil",
  name: "Brazil",
  slug: "brazil",
  countryCode: "BRA",
  flagUrl: "/flags/br.svg",
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
};

describe("TeamCard", () => {
  it("labels eliminated playable teams as eliminated instead of alive", () => {
    render(
      <TeamCard
        team={{
          ...baseTeam,
          status: "eliminated",
          isPlayable: true,
          eliminatedAt: "2026-07-05",
          deathMatchId: "match_brazil_2026",
        }}
        dictionary={dictionaries.en}
      />,
    );

    expect(screen.getByText("Eliminated")).toBeInTheDocument();
    expect(screen.queryByText("Still alive")).not.toBeInTheDocument();
  });
});
