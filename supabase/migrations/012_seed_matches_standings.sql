-- Migration 012: re-sync users, seed group standings + matches, add reset_scores()

-- ============================================================
-- 1. Re-sync public.users from auth.users
--    (migration 010 wiped the users table; existing sessions have no profile row)
-- ============================================================
INSERT INTO public.users (id, email, display_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email        = EXCLUDED.email,
  display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
  avatar_url   = COALESCE(EXCLUDED.avatar_url,   public.users.avatar_url);

-- Re-trigger couple linking (fn_link_user_to_couple fires BEFORE UPDATE OF email)
UPDATE public.users SET email = email WHERE email IS NOT NULL;

-- ============================================================
-- 2. Seed group_standings with 0-stat rows for every couple
-- ============================================================
INSERT INTO group_standings (couple_id, division, group_code, rank,
  matches_played, matches_won, matches_lost,
  games_for, games_against, game_differential, points)
SELECT id, division, group_code, seed, 0, 0, 0, 0, 0, 0, 0
FROM couples
WHERE division IN ('diamant', 'or', 'plata') AND group_code IS NOT NULL
ON CONFLICT (couple_id, division, group_code) DO NOTHING;

-- ============================================================
-- 3. Create group phase matches (only if none exist yet)
--    Round-robin within each group of 4:
--      R1: seed1 vs seed2, seed3 vs seed4
--      R2: seed1 vs seed3, seed2 vs seed4
--      R3: seed1 vs seed4, seed2 vs seed3
-- ============================================================
DO $$
DECLARE
  r RECORD;
  c UUID[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM matches WHERE phase = 'group') THEN
    FOR r IN
      SELECT DISTINCT division, group_code
      FROM couples
      WHERE group_code IS NOT NULL
      ORDER BY division, group_code
    LOOP
      SELECT ARRAY_AGG(id ORDER BY seed) INTO c
      FROM couples
      WHERE division = r.division AND group_code = r.group_code;

      IF array_length(c, 1) = 4 THEN
        INSERT INTO matches
          (division, phase, group_code, round, position, couple_a_id, couple_b_id, status)
        VALUES
          (r.division, 'group', r.group_code, 'R1', 1, c[1], c[2], 'scheduled'),
          (r.division, 'group', r.group_code, 'R1', 2, c[3], c[4], 'scheduled'),
          (r.division, 'group', r.group_code, 'R2', 1, c[1], c[3], 'scheduled'),
          (r.division, 'group', r.group_code, 'R2', 2, c[2], c[4], 'scheduled'),
          (r.division, 'group', r.group_code, 'R3', 1, c[1], c[4], 'scheduled'),
          (r.division, 'group', r.group_code, 'R3', 2, c[2], c[3], 'scheduled');
      END IF;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 4. reset_scores() — replaces old reset_test_data()
--    Resets ALL group match scores and standings to zero.
-- ============================================================
CREATE OR REPLACE FUNCTION reset_scores()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE matches SET
    score_a      = NULL,
    score_b      = NULL,
    games_a      = 0,
    games_b      = 0,
    status       = 'scheduled',
    winner_id    = NULL,
    submitted_by = NULL,
    confirmed_at = NULL
  WHERE phase = 'group';

  UPDATE group_standings SET
    matches_played    = 0,
    matches_won       = 0,
    matches_lost      = 0,
    games_for         = 0,
    games_against     = 0,
    game_differential = 0,
    points            = 0;
END;
$$;
