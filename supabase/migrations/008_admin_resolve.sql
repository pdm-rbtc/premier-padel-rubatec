-- 008_admin_resolve.sql
-- Admin override: set final score, winner, and advance winner to next match

CREATE OR REPLACE FUNCTION admin_resolve_match(
  p_match_id  UUID,
  p_actor_id  UUID,
  p_winner_id UUID,
  p_score_a   TEXT,
  p_score_b   TEXT,
  p_games_a   INTEGER,
  p_games_b   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  UPDATE matches SET
    status       = 'confirmed',
    winner_id    = p_winner_id,
    score_a      = p_score_a,
    score_b      = p_score_b,
    games_a      = p_games_a,
    games_b      = p_games_b,
    confirmed_at = now()
  WHERE id = p_match_id;

  -- Advance winner to next knockout match
  IF v_match.next_match_id IS NOT NULL THEN
    IF v_match.next_match_slot = 'couple_a' THEN
      UPDATE matches SET couple_a_id = p_winner_id WHERE id = v_match.next_match_id;
    ELSE
      UPDATE matches SET couple_b_id = p_winner_id WHERE id = v_match.next_match_id;
    END IF;
  END IF;

  INSERT INTO match_log (match_id, action, actor_id, payload)
  VALUES (p_match_id, 'admin_override', p_actor_id,
    jsonb_build_object(
      'winner_id', p_winner_id,
      'score_a',   p_score_a,
      'score_b',   p_score_b
    ));
END;
$$;
