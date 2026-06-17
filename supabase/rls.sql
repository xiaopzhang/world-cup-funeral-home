-- Row Level Security hardening for the public API schema.
--
-- The application performs database work from trusted Next.js server routes
-- with SUPABASE_SERVICE_ROLE_KEY. Public/anon clients should not be able to
-- mutate data directly through PostgREST. Service role bypasses RLS.

alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.tombstones enable row level security;
alter table public.interactions enable row level security;
alter table public.tributes enable row level security;
alter table public.tribute_votes enable row level security;
alter table public.cause_library enable row level security;
alter table public.epitaph_library enable row level security;
alter table public.activity_feed enable row level security;
alter table public.team_aliases enable row level security;
alter table public.sync_runs enable row level security;
alter table public.provider_matches enable row level security;
alter table public.team_status_events enable row level security;
alter table public.reports enable row level security;
alter table public.rate_limits enable row level security;

-- Least-privilege public reads for data that is intentionally public.
drop policy if exists "Public can read teams" on public.teams;
create policy "Public can read teams"
  on public.teams
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read matches" on public.matches;
create policy "Public can read matches"
  on public.matches
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read approved tombstones" on public.tombstones;
create policy "Public can read approved tombstones"
  on public.tombstones
  for select
  to anon, authenticated
  using (is_public = true and moderation_status = 'approved');

drop policy if exists "Public can read approved tributes" on public.tributes;
create policy "Public can read approved tributes"
  on public.tributes
  for select
  to anon, authenticated
  using (moderation_status = 'approved');

drop policy if exists "Public can read active causes" on public.cause_library;
create policy "Public can read active causes"
  on public.cause_library
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active epitaphs" on public.epitaph_library;
create policy "Public can read active epitaphs"
  on public.epitaph_library
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read tombstone activity" on public.activity_feed;
create policy "Public can read tombstone activity"
  on public.activity_feed
  for select
  to anon, authenticated
  using (activity_type = 'tombstone_created');

-- No anon/authenticated INSERT/UPDATE/DELETE policies are defined. Writes for
-- tombstones, rituals, tributes, reports, admin sync, and rate limits must go
-- through the server-side service role client.
