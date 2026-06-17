import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202606170001_enable_public_rls.sql",
  "utf8",
);

const publicTables = [
  "teams",
  "matches",
  "tombstones",
  "interactions",
  "tributes",
  "tribute_votes",
  "cause_library",
  "epitaph_library",
  "activity_feed",
  "team_aliases",
  "sync_runs",
  "provider_matches",
  "team_status_events",
  "reports",
  "rate_limits",
];

describe("Supabase RLS migration", () => {
  it("enables RLS on every public table", () => {
    for (const table of publicTables) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("does not grant anonymous write policies", () => {
    expect(migration).not.toMatch(/for\s+(insert|update|delete|all)\s+to\s+anon/i);
    expect(migration).not.toMatch(/for\s+(insert|update|delete|all)\s+to\s+authenticated/i);
  });
});
