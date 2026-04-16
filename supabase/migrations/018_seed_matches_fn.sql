-- Migration 018: seed_group_matches() + patch randomize to auto-seed

-- ============================================================
-- 1. seed_group_matches() — creates round-robin group matches
--    Skips groups that already have matches.
--    Returns the number of matches created.
-- ============================================================
CREATE OR REPLACE FUNCTION seed_group_matches()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r       RECORD;
  c       UUID[];
  created INTEGER := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT division, group_code
    FROM couples
    WHERE group_code IS NOT NULL
    ORDER BY division, group_code
  LOOP
    -- Skip if this group already has matches
    IF EXISTS (
      SELECT 1 FROM matches
      WHERE phase = 'group' AND division = r.division AND group_code = r.group_code
    ) THEN
      CONTINUE;
    END IF;

    SELECT ARRAY_AGG(id ORDER BY COALESCE(seed, 9999), id::TEXT) INTO c
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
      created := created + 6;
    END IF;
  END LOOP;
  RETURN created;
END;
$$;
GRANT EXECUTE ON FUNCTION seed_group_matches() TO authenticated;

-- ============================================================
-- 2. Patch randomize_group_results to auto-seed missing matches
-- ============================================================
CREATE OR REPLACE FUNCTION randomize_group_results()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match    RECORD;
  v_winner   UUID;
  v_gw       INTEGER;
  v_gl       INTEGER;
  v_wgf      INTEGER;
  v_wga      INTEGER;
  v_lgf      INTEGER;
  v_lga      INTEGER;
BEGIN
  -- Auto-create missing group matches before randomizing
  PERFORM seed_group_matches();

  FOR v_match IN
    SELECT * FROM matches
    WHERE phase = 'group'
      AND status = 'scheduled'
      AND couple_a_id IS NOT NULL
      AND couple_b_id IS NOT NULL
    ORDER BY division, group_code, round, position
  LOOP
    IF random() >= 0.5 THEN
      v_winner := v_match.couple_a_id;
    ELSE
      v_winner := v_match.couple_b_id;
    END IF;

    v_gw := 8  + floor(random() * 5)::int;
    v_gl := 3  + floor(random() * 5)::int;

    IF v_winner = v_match.couple_a_id THEN
      v_wgf := v_gw; v_wga := v_gl;
      v_lgf := v_gl; v_lga := v_gw;
      UPDATE matches SET
        score_a = v_gw || '-' || v_gl,
        score_b = v_gl || '-' || v_gw,
        games_a = v_gw, games_b = v_gl,
        status = 'confirmed', winner_id = v_winner,
        submitted_by = v_match.couple_a_id,
        confirmed_at = now() - (random() * interval '4 hours')
      WHERE id = v_match.id;
    ELSE
      v_wgf := v_gw; v_wga := v_gl;
      v_lgf := v_gl; v_lga := v_gw;
      UPDATE matches SET
        score_a = v_gl || '-' || v_gw,
        score_b = v_gw || '-' || v_gl,
        games_a = v_gl, games_b = v_gw,
        status = 'confirmed', winner_id = v_winner,
        submitted_by = v_match.couple_b_id,
        confirmed_at = now() - (random() * interval '4 hours')
      WHERE id = v_match.id;
    END IF;

    UPDATE group_standings SET
      matches_played    = matches_played + 1,
      matches_won       = matches_won + 1,
      points            = points + 3,
      games_for         = games_for    + v_wgf,
      games_against     = games_against + v_wga,
      game_differential = game_differential + (v_wgf - v_wga),
      updated_at        = now()
    WHERE couple_id = v_winner
      AND division   = v_match.division
      AND group_code = v_match.group_code;

    UPDATE group_standings SET
      matches_played    = matches_played + 1,
      matches_lost      = matches_lost + 1,
      games_for         = games_for    + v_lgf,
      games_against     = games_against + v_lga,
      game_differential = game_differential + (v_lgf - v_lga),
      updated_at        = now()
    WHERE couple_id != v_winner
      AND couple_id IN (v_match.couple_a_id, v_match.couple_b_id)
      AND division   = v_match.division
      AND group_code = v_match.group_code;
  END LOOP;

  PERFORM recalculate_group_rank(division, group_code)
  FROM (SELECT DISTINCT division, group_code FROM matches WHERE phase = 'group') g;
END;
$$;
