create table if not exists public.teams (
  id text primary key,
  name text not null,
  slug text unique not null,
  country_code text not null,
  flag_url text not null,
  status text not null check (status in ('alive', 'eliminated', 'early_admission', 'champion', 'pending')),
  admission_type text not null check (admission_type in ('world_cup_elimination', 'early_admission')),
  is_playable boolean not null default false,
  eliminated_at timestamptz,
  death_match_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  stage text not null,
  date date,
  venue text,
  team_a_id text,
  team_b_id text,
  team_a_score integer,
  team_b_score integer,
  extra_time boolean not null default false,
  penalty_score text,
  winner_team_id text,
  loser_team_id text,
  status text not null default 'final',
  source text not null,
  display_text text,
  broadcast_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tombstones (
  id text primary key,
  team_id text not null references public.teams(id),
  death_match_id text not null references public.matches(id),
  cause_of_death text not null,
  epitaph text not null,
  buried_by text not null default 'Anonymous Fan',
  created_at timestamptz not null default now(),
  share_slug text unique not null,
  flower_count integer not null default 0,
  candle_count integer not null default 0,
  incense_count integer not null default 0,
  tribute_count integer not null default 0,
  is_public boolean not null default true,
  moderation_status text not null default 'approved'
);

create table if not exists public.interactions (
  id text primary key,
  tombstone_id text not null references public.tombstones(id),
  team_id text not null references public.teams(id),
  interaction_type text not null check (interaction_type in ('flower', 'candle', 'incense')),
  created_at timestamptz not null default now(),
  ip_hash text,
  user_agent_hash text
);

create table if not exists public.tributes (
  id text primary key,
  tombstone_id text not null references public.tombstones(id),
  team_id text not null references public.teams(id),
  tribute_text text not null,
  created_at timestamptz not null default now(),
  author_name text not null default 'Anonymous Fan',
  moderation_status text not null default 'approved',
  report_count integer not null default 0
);

create table if not exists public.cause_library (
  id text primary key,
  team_id text references public.teams(id),
  cause_text text not null,
  category text not null default 'team',
  scenario text,
  is_team_specific boolean not null default false,
  is_user_generated boolean not null default false,
  usage_count integer not null default 0,
  report_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.epitaph_library (
  id text primary key,
  team_id text references public.teams(id),
  epitaph_text text not null,
  tone text,
  scenario text,
  is_team_specific boolean not null default false,
  is_user_generated boolean not null default false,
  usage_count integer not null default 0,
  share_count integer not null default 0,
  report_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_feed (
  id text primary key,
  activity_type text not null,
  team_id text not null references public.teams(id),
  tombstone_id text references public.tombstones(id),
  tribute_id text references public.tributes(id),
  interaction_type text,
  display_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_aliases (
  id text primary key,
  team_id text not null references public.teams(id),
  provider text not null,
  provider_team_id text,
  provider_team_name text not null,
  created_at timestamptz not null default now(),
  unique (provider, provider_team_name)
);

create table if not exists public.sync_runs (
  id text primary key,
  provider text not null,
  status text not null check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  processed_count integer not null default 0,
  changed_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_matches (
  id text primary key,
  provider text not null,
  provider_match_id text not null unique,
  stage text,
  match_date date,
  raw_hash text not null,
  payload_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_status_events (
  id text primary key,
  team_id text not null references public.teams(id),
  provider_match_id text,
  from_status text not null,
  to_status text not null,
  reason text not null,
  source text not null,
  rolled_back_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id text primary key,
  target_type text not null check (target_type in ('tombstone', 'tribute')),
  target_id text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id text primary key,
  action text not null,
  subject_hash text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (action, subject_hash, window_start)
);

create index if not exists tombstones_team_id_idx on public.tombstones(team_id);
create index if not exists interactions_tombstone_id_idx on public.interactions(tombstone_id);
create index if not exists tributes_team_id_idx on public.tributes(team_id);
create index if not exists activity_feed_created_at_idx on public.activity_feed(created_at desc);
create index if not exists provider_matches_provider_match_id_idx on public.provider_matches(provider_match_id);
create index if not exists sync_runs_created_at_idx on public.sync_runs(created_at desc);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
create index if not exists team_status_events_created_at_idx on public.team_status_events(created_at desc);
