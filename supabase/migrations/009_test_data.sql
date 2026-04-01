-- 009_test_data.sql — Test couple for pdemora@rubatec.cat

-- Create pdemora's test couple (use ON CONFLICT to be idempotent)
INSERT INTO couples (id, team_name, player_1_name, player_2_name, division, group_code, seed, department, centre)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'De Mora / Villanueva',
  'Pablo de Mora',
  'Aurelio Villanueva',
  'plata',
  'G1',
  1,
  'Admin',
  'Viladecans'
) ON CONFLICT (id) DO NOTHING;

-- Create opponent couples for test matches
INSERT INTO couples (id, team_name, player_1_name, player_2_name, division, group_code, seed, department, centre)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Montero / Aranda',   'Joaquín Montero',  'Cristóbal Aranda',   'plata', 'G1', 2, 'Edificació', 'Cornellà'),
  ('00000000-0000-0000-0000-000000000003', 'Ibarra / Esquivel',  'Bernardo Ibarra',  'Valentín Esquivel',  'plata', 'G1', 3, 'Manteniment', 'Motors 1')
ON CONFLICT (id) DO NOTHING;

-- Insert group standings rows for these couples (so they appear in group tables)
INSERT INTO group_standings (couple_id, division, group_code, matches_played, matches_won, matches_lost, games_for, games_against, game_differential, points, rank)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'plata', 'G1', 2, 2, 0, 12,  8,  4, 6, 1),
  ('00000000-0000-0000-0000-000000000002', 'plata', 'G1', 2, 1, 1, 10, 10,  0, 3, 2),
  ('00000000-0000-0000-0000-000000000003', 'plata', 'G1', 2, 0, 2,  8, 12, -4, 0, 3)
ON CONFLICT (couple_id, division, group_code) DO UPDATE SET
  matches_played    = EXCLUDED.matches_played,
  matches_won       = EXCLUDED.matches_won,
  matches_lost      = EXCLUDED.matches_lost,
  games_for         = EXCLUDED.games_for,
  games_against     = EXCLUDED.games_against,
  game_differential = EXCLUDED.game_differential,
  points            = EXCLUDED.points,
  rank              = EXCLUDED.rank;

-- Create test matches: 2 confirmed (wins), 1 pending_confirmation
INSERT INTO matches (
  id, division, phase, group_code, round, position,
  couple_a_id, couple_b_id,
  score_a, score_b, games_a, games_b,
  status, winner_id, submitted_by,
  time_slot, court
)
VALUES
  -- Match 1: Won (confirmed)
  (
    '00000000-0000-0000-1111-000000000001',
    'plata', 'group', 'G1', 'R1', 1,
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '6-4', '4-6', 6, 4,
    'confirmed',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '9:30h - 10:00h', 'Pista 7'
  ),
  -- Match 2: Won (confirmed, as couple_b)
  (
    '00000000-0000-0000-1111-000000000002',
    'plata', 'group', 'G1', 'R2', 1,
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '4-6', '6-4', 4, 6,
    'confirmed',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '10:30h - 11:00h', 'Pista 3'
  ),
  -- Match 3: Pending confirmation (opponent submitted, pdemora needs to confirm/dispute)
  (
    '00000000-0000-0000-1111-000000000003',
    'plata', 'group', 'G1', 'R3', 1,
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '6-3', '3-6', 6, 3,
    'pending_confirmation',
    NULL,
    '00000000-0000-0000-0000-000000000002',
    '11:30h - 12:00h', 'Pista 11'
  )
ON CONFLICT (id) DO NOTHING;

-- Auto-link pdemora@rubatec.cat to their test couple (runs if user already exists)
DO $$ BEGIN
  UPDATE public.users
  SET couple_id = '00000000-0000-0000-0000-000000000001'
  WHERE email = 'pdemora@rubatec.cat' AND couple_id IS NULL;
END $$;

-- Trigger: auto-link pdemora when they log in
CREATE OR REPLACE FUNCTION link_test_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.email = 'pdemora@rubatec.cat' AND NEW.couple_id IS NULL THEN
    NEW.couple_id := '00000000-0000-0000-0000-000000000001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_link_test_user ON public.users;
CREATE TRIGGER tr_link_test_user
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION link_test_user();

-- Reset function: restores test matches to original state
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Reset all group phase matches
  UPDATE matches SET
    status       = 'scheduled',
    score_a      = NULL,
    score_b      = NULL,
    games_a      = 0,
    games_b      = 0,
    winner_id    = NULL,
    submitted_by = NULL,
    confirmed_at = NULL
  WHERE phase = 'group';

  -- Reset group standings (except pdemora's seeded ones — restored below)
  UPDATE group_standings SET
    matches_played    = 0,
    matches_won       = 0,
    matches_lost      = 0,
    games_for         = 0,
    games_against     = 0,
    game_differential = 0,
    points            = 0,
    rank              = NULL
  WHERE (couple_id, division, group_code) NOT IN (
    VALUES
      ('00000000-0000-0000-0000-000000000001'::uuid, 'plata', 'G1'),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'plata', 'G1'),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'plata', 'G1')
  );

  -- Restore pdemora's test matches
  UPDATE matches SET
    status       = 'confirmed',
    score_a      = '6-4',
    score_b      = '4-6',
    games_a      = 6,
    games_b      = 4,
    winner_id    = '00000000-0000-0000-0000-000000000001',
    submitted_by = '00000000-0000-0000-0000-000000000001'
  WHERE id = '00000000-0000-0000-1111-000000000001';

  UPDATE matches SET
    status       = 'confirmed',
    score_a      = '4-6',
    score_b      = '6-4',
    games_a      = 4,
    games_b      = 6,
    winner_id    = '00000000-0000-0000-0000-000000000001',
    submitted_by = '00000000-0000-0000-0000-000000000003'
  WHERE id = '00000000-0000-0000-1111-000000000002';

  UPDATE matches SET
    status       = 'pending_confirmation',
    score_a      = '6-3',
    score_b      = '3-6',
    games_a      = 6,
    games_b      = 3,
    winner_id    = NULL,
    submitted_by = '00000000-0000-0000-0000-000000000002'
  WHERE id = '00000000-0000-0000-1111-000000000003';

  -- Restore pdemora's standings
  UPDATE group_standings SET
    matches_played = 2, matches_won = 2, matches_lost = 0,
    games_for = 12, games_against = 8, game_differential = 4,
    points = 6, rank = 1
  WHERE couple_id = '00000000-0000-0000-0000-000000000001';

  UPDATE group_standings SET
    matches_played = 2, matches_won = 1, matches_lost = 1,
    games_for = 10, games_against = 10, game_differential = 0,
    points = 3, rank = 2
  WHERE couple_id = '00000000-0000-0000-0000-000000000002';

  UPDATE group_standings SET
    matches_played = 2, matches_won = 0, matches_lost = 2,
    games_for = 8, games_against = 12, game_differential = -4,
    points = 0, rank = 3
  WHERE couple_id = '00000000-0000-0000-0000-000000000003';
END;
$$;
