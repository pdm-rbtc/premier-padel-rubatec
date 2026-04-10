-- Migration 016: Fix reset_scores() — reset ranks, clear knockout slots, add grants

CREATE OR REPLACE FUNCTION reset_scores()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Reset all group match scores/status
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

  -- 2. Reset group standings to zero; restore rank to initial seed order
  UPDATE group_standings gs SET
    matches_played    = 0,
    matches_won       = 0,
    matches_lost      = 0,
    games_for         = 0,
    games_against     = 0,
    game_differential = 0,
    points            = 0,
    rank              = c.seed
  FROM couples c
  WHERE gs.couple_id = c.id;

  -- 3. Clear team assignments + scores from knockout matches (keep bracket structure)
  UPDATE matches SET
    couple_a_id  = NULL,
    couple_b_id  = NULL,
    score_a      = NULL,
    score_b      = NULL,
    games_a      = 0,
    games_b      = 0,
    status       = 'scheduled',
    winner_id    = NULL,
    submitted_by = NULL,
    confirmed_at = NULL
  WHERE phase = 'knockout';
END;
$$;

-- Ensure authenticated users (admins) can call these RPCs
GRANT EXECUTE ON FUNCTION reset_scores()            TO authenticated;
GRANT EXECUTE ON FUNCTION randomize_group_results() TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_group_rank(TEXT, TEXT) TO authenticated;
