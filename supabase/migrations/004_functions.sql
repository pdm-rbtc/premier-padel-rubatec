-- 004_functions.sql
-- Function to confirm a match score and trigger side effects

CREATE OR REPLACE FUNCTION confirm_match(
  p_match_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match matches%ROWTYPE;
  v_games_a INTEGER;
  v_games_b INTEGER;
  v_winner_id UUID;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF v_match.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'Match is not in pending_confirmation state';
  END IF;

  -- Parse total games from score (stored as games_a/games_b columns)
  v_games_a := v_match.games_a;
  v_games_b := v_match.games_b;

  IF v_games_a > v_games_b THEN
    v_winner_id := v_match.couple_a_id;
  ELSE
    v_winner_id := v_match.couple_b_id;
  END IF;

  -- Update match
  UPDATE matches SET
    status = 'confirmed',
    winner_id = v_winner_id,
    confirmed_at = now()
  WHERE id = p_match_id;

  -- Update standings if group phase
  IF v_match.phase = 'group' THEN
    UPDATE group_standings SET
      matches_played = matches_played + 1,
      matches_won = matches_won + 1,
      points = points + 3,
      games_for = games_for + v_games_a,
      games_against = games_against + v_games_b,
      game_differential = game_differential + (v_games_a - v_games_b),
      updated_at = now()
    WHERE couple_id = v_winner_id AND division = v_match.division AND group_code = v_match.group_code;

    UPDATE group_standings SET
      matches_played = matches_played + 1,
      matches_lost = matches_lost + 1,
      games_for = games_for + v_games_b,
      games_against = games_against + v_games_a,
      game_differential = game_differential + (v_games_b - v_games_a),
      updated_at = now()
    WHERE couple_id != v_winner_id
      AND couple_id IN (v_match.couple_a_id, v_match.couple_b_id)
      AND division = v_match.division AND group_code = v_match.group_code;
  END IF;

  -- Advance winner to next knockout match
  IF v_match.next_match_id IS NOT NULL THEN
    IF v_match.next_match_slot = 'couple_a' THEN
      UPDATE matches SET couple_a_id = v_winner_id WHERE id = v_match.next_match_id;
    ELSE
      UPDATE matches SET couple_b_id = v_winner_id WHERE id = v_match.next_match_id;
    END IF;
  END IF;

  -- Log the action
  INSERT INTO match_log (match_id, action, actor_id, payload)
  VALUES (p_match_id, 'score_confirmed', p_actor_id, jsonb_build_object('winner_id', v_winner_id));
END;
$$;
