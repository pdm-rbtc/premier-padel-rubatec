-- Migration 014: Fix confirm_match() game stats assignment + reset corrupt standings

-- Fixed: winner's games_for/games_against now correctly reflects which side won,
-- not always couple_a's perspective.
CREATE OR REPLACE FUNCTION confirm_match(
  p_match_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- Reset corrupted standings from previously confirmed matches with wrong game counts.
-- User should re-enter scores from scratch.
SELECT reset_scores();
