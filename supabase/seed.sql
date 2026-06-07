insert into public.teams (id, name, slug, country_code, flag_url, status, admission_type, is_playable, eliminated_at, death_match_id)
values
  ('team_italy', 'Italy', 'italy', 'it', 'https://flagcdn.com/w160/it.png', 'early_admission', 'early_admission', true, '2026-03-31', 'match_italy_early_admission')
on conflict (id) do update set
  status = excluded.status,
  admission_type = excluded.admission_type,
  is_playable = excluded.is_playable,
  eliminated_at = excluded.eliminated_at,
  death_match_id = excluded.death_match_id,
  updated_at = now();

insert into public.matches (id, stage, date, venue, team_a_id, team_b_id, team_a_score, team_b_score, extra_time, penalty_score, winner_team_id, loser_team_id, status, source)
values
  (
    'match_italy_early_admission',
    'European Qualifying Playoff Final',
    '2026-03-31',
    'Qualification waiting room',
    null,
    'team_italy',
    1,
    1,
    false,
    'Bosnia and Herzegovina won on penalties',
    null,
    'team_italy',
    'final',
    'MVP fixed death event from product requirements'
  )
on conflict (id) do update set
  stage = excluded.stage,
  date = excluded.date,
  venue = excluded.venue,
  penalty_score = excluded.penalty_score,
  updated_at = now();

insert into public.cause_library (id, team_id, cause_text, category, is_team_specific)
values
  ('cause_generic_1', null, 'Penalty heartbreak', 'generic', false),
  ('cause_generic_2', null, 'Last-minute collapse', 'generic', false),
  ('cause_generic_3', null, 'Group stage disaster', 'generic', false),
  ('cause_generic_4', null, 'VAR incident', 'generic', false),
  ('cause_generic_5', null, 'Manager disasterclass', 'generic', false),
  ('cause_generic_6', null, 'Goalkeeper mistake', 'generic', false),
  ('cause_generic_7', null, 'Striker missed everything', 'generic', false),
  ('cause_generic_8', null, 'Too much hope before kickoff', 'generic', false),
  ('cause_generic_9', null, 'Curse activated', 'generic', false),
  ('cause_generic_10', null, 'Classic national trauma', 'generic', false),
  ('cause_generic_11', null, 'Golden generation expired', 'generic', false),
  ('cause_generic_12', null, 'Football gods said no', 'generic', false),
  ('cause_generic_13', null, 'Tactical overthinking', 'generic', false),
  ('cause_generic_14', null, 'Emotional damage beyond repair', 'generic', false),
  ('cause_generic_15', null, 'Defensive system disappeared', 'generic', false),
  ('cause_generic_16', null, 'Extra-time soul drain', 'generic', false),
  ('cause_generic_17', null, 'Hope died before the final whistle', 'generic', false),
  ('cause_generic_18', null, 'The scoreboard committed violence', 'generic', false),
  ('cause_italy_1', 'team_italy', 'Football royalty denied entry', 'team', true),
  ('cause_italy_2', 'team_italy', 'Four stars, zero invitations', 'team', true),
  ('cause_italy_3', 'team_italy', 'The World Cup watched from home', 'team', true),
  ('cause_italy_4', 'team_italy', 'Qualification trauma relapse', 'team', true),
  ('cause_italy_5', 'team_italy', 'Penalty heartbreak, Italian edition', 'team', true),
  ('cause_italy_6', 'team_italy', 'The Azzurri missed the bus', 'team', true),
  ('cause_italy_7', 'team_italy', 'Catenaccio couldn’t defend destiny', 'team', true),
  ('cause_italy_8', 'team_italy', 'The anthem was ready. The invitation was not.', 'team', true)
on conflict (id) do nothing;

insert into public.epitaph_library (id, team_id, epitaph_text, tone, is_team_specific)
values
  ('epitaph_italy_1', 'team_italy', 'Four stars above the badge. No seat at the table.', 'dark_comedy', true),
  ('epitaph_italy_2', 'team_italy', 'The anthem was ready. The invitation was not.', 'dark_comedy', true),
  ('epitaph_italy_3', 'team_italy', 'Here lies a giant, locked outside its own museum.', 'dark_comedy', true),
  ('epitaph_italy_4', 'team_italy', 'Catenaccio defended everything except fate.', 'dark_comedy', true),
  ('epitaph_italy_5', 'team_italy', 'Italy didn’t lose the World Cup. It lost the doorway.', 'dark_comedy', true)
on conflict (id) do nothing;
