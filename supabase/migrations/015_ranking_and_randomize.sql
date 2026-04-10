-- Migration 015: Correct group rank recalculation + randomize_group_results()

-- ============================================================
-- 1. recalculate_group_rank(division, group_code)
--    Rank rule: points DESC → game_differential DESC → head-to-head
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_group_rank(p_division TEXT, p_group_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE group_standings gs
  SET rank = (
    SELECT COUNT(*) + 1
    FROM group_standings gs2
    WHERE gs2.division   = p_division
      AND gs2.group_code = p_group_code
      AND gs2.couple_id != gs.couple_id
      AND (
        -- More points → ranked above
        gs2.points > gs.points
        -- Same points, better game differential → ranked above
        OR (gs2.points = gs.points
            AND gs2.game_differential > gs.game_differential)
        -- Same points, same diff, won the direct match → ranked above
        OR (gs2.points = gs.points
            AND gs2.game_differential = gs.game_differential
            AND EXISTS (
              SELECT 1 FROM matches m
              WHERE m.status      = 'confirmed'
                AND m.division    = p_division
                AND m.group_code  = p_group_code
                AND m.winner_id   = gs2.couple_id
                AND (  (m.couple_a_id = gs2.couple_id AND m.couple_b_id = gs.couple_id)
                    OR (m.couple_a_id = gs.couple_id  AND m.couple_b_id = gs2.couple_id))
            ))
      )
  )
  WHERE gs.division   = p_division
    AND gs.group_code = p_group_code;
END;
$$;

-- ============================================================
-- 2. Patch confirm_match() to call recalculate_group_rank
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_match(
  p_match_id UUID,
  p_actor_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match               matches%ROWTYPE;
  v_games_a             INTEGER;
  v_games_b             INTEGER;
  v_winner_id           UUID;
  v_winner_games_for    INTEGER;
  v_winner_games_against INTEGER;
  v_loser_games_for     INTEGER;
  v_loser_games_against  INTEGER;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF v_match.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'Match is not in pending_confirmation state';
  END IF;

  v_games_a := v_match.games_a;
  v_games_b := v_match.games_b;

  IF v_games_a > v_games_b THEN
    v_winner_id            := v_match.couple_a_id;
    v_winner_games_for     := v_games_a;
    v_winner_games_against := v_games_b;
    v_loser_games_for      := v_games_b;
    v_loser_games_against  := v_games_a;
  ELSE
    v_winner_id            := v_match.couple_b_id;
    v_winner_games_for     := v_games_b;
    v_winner_games_against := v_games_a;
    v_loser_games_for      := v_games_a;
    v_loser_games_against  := v_games_b;
  END IF;

  UPDATE matches SET
    status       = 'confirmed',
    winner_id    = v_winner_id,
    confirmed_at = now()
  WHERE id = p_match_id;

  IF v_match.phase = 'group' THEN
    UPDATE group_standings SET
      matches_played    = matches_played + 1,
      matches_won       = matches_won + 1,
      points            = points + 3,
      games_for         = games_for    + v_winner_games_for,
      games_against     = games_against + v_winner_games_against,
      game_differential = game_differential + (v_winner_games_for - v_winner_games_against),
      updated_at        = now()
    WHERE couple_id = v_winner_id
      AND division   = v_match.division
      AND group_code = v_match.group_code;

    UPDATE group_standings SET
      matches_played    = matches_played + 1,
      matches_lost      = matches_lost + 1,
      games_for         = games_for    + v_loser_games_for,
      games_against     = games_against + v_loser_games_against,
      game_differential = game_differential + (v_loser_games_for - v_loser_games_against),
      updated_at        = now()
    WHERE couple_id != v_winner_id
      AND couple_id IN (v_match.couple_a_id, v_match.couple_b_id)
      AND division   = v_match.division
      AND group_code = v_match.group_code;

    -- Recalculate rank for every couple in this group
    PERFORM recalculate_group_rank(v_match.division, v_match.group_code);
  END IF;

  IF v_match.next_match_id IS NOT NULL THEN
    IF v_match.next_match_slot = 'couple_a' THEN
      UPDATE matches SET couple_a_id = v_winner_id WHERE id = v_match.next_match_id;
    ELSE
      UPDATE matches SET couple_b_id = v_winner_id WHERE id = v_match.next_match_id;
    END IF;
  END IF;

  INSERT INTO match_log (match_id, action, actor_id, payload)
  VALUES (p_match_id, 'score_confirmed', p_actor_id,
    jsonb_build_object('winner_id', v_winner_id));
END;
$$;

-- ============================================================
-- 3. randomize_group_results()
--    Fills all remaining scheduled group matches with random
--    realistic scores, confirms them, and recalculates ranks.
--    For dev/testing only.
-- ============================================================
CREATE OR REPLACE FUNCTION randomize_group_results()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match    RECORD;
  v_winner   UUID;
  v_gw       INTEGER;  -- winner games
  v_gl       INTEGER;  -- loser games
  v_wgf      INTEGER;
  v_wga      INTEGER;
  v_lgf      INTEGER;
  v_lga      INTEGER;
BEGIN
  FOR v_match IN
    SELECT * FROM matches
    WHERE phase = 'group'
      AND status = 'scheduled'
      AND couple_a_id IS NOT NULL
      AND couple_b_id IS NOT NULL
    ORDER BY division, group_code, round, position
  LOOP
    -- Random winner
    IF random() >= 0.5 THEN
      v_winner := v_match.couple_a_id;
    ELSE
      v_winner := v_match.couple_b_id;
    END IF;

    -- Realistic padel scores: winner 8–12, loser 3–7
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
        submitted_by = v_match.couple_a_id, confirmed_at = now() - (random() * interval '4 hours')
      WHERE id = v_match.id;
    ELSE
      v_wgf := v_gw; v_wga := v_gl;
      v_lgf := v_gl; v_lga := v_gw;
      UPDATE matches SET
        score_a = v_gl || '-' || v_gw,
        score_b = v_gw || '-' || v_gl,
        games_a = v_gl, games_b = v_gw,
        status = 'confirmed', winner_id = v_winner,
        submitted_by = v_match.couple_b_id, confirmed_at = now() - (random() * interval '4 hours')
      WHERE id = v_match.id;
    END IF;

    -- Update winner standings
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

    -- Update loser standings
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

  -- Recalculate ranks for all groups after all scores are in
  PERFORM recalculate_group_rank(division, group_code)
  FROM (SELECT DISTINCT division, group_code FROM matches WHERE phase = 'group') g;
END;
$$;

-- Recalculate ranks for any already-confirmed matches (fix seeded/existing data)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT division, group_code FROM group_standings LOOP
    PERFORM recalculate_group_rank(r.division, r.group_code);
  END LOOP;
END $$;
