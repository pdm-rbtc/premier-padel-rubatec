-- Migration 017: PIN-based login for players without @rubatec.cat email
-- Adds login_pin column to couples + SECURITY DEFINER RPCs accessible to anon.

-- 1. Column
ALTER TABLE couples ADD COLUMN IF NOT EXISTS login_pin TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS couples_login_pin_unique
  ON couples(login_pin)
  WHERE login_pin IS NOT NULL;

-- ============================================================
-- 2. couple_by_pin — look up couple by PIN (no auth required)
-- ============================================================
CREATE OR REPLACE FUNCTION couple_by_pin(p_pin TEXT)
RETURNS TABLE(couple_id UUID, team_name TEXT, division TEXT, group_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT id, c.team_name, c.division, c.group_code
    FROM couples c
    WHERE c.login_pin = upper(trim(p_pin))
      AND c.login_pin IS NOT NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION couple_by_pin(TEXT) TO anon, authenticated;

-- ============================================================
-- 3. submit_score_pin — submit a score using a couple's PIN
--    Validates PIN, validates couple is in the match, then
--    writes the score (same effect as ScoreInput direct update).
-- ============================================================
CREATE OR REPLACE FUNCTION submit_score_pin(
  p_match_id UUID,
  p_pin      TEXT,
  p_games_a  INT,
  p_games_b  INT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id UUID;
  v_match     matches%ROWTYPE;
BEGIN
  -- Resolve PIN → couple
  SELECT id INTO v_couple_id
  FROM couples
  WHERE login_pin = upper(trim(p_pin))
    AND login_pin IS NOT NULL;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  -- Fetch match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado';
  END IF;

  -- Couple must participate
  IF v_couple_id != v_match.couple_a_id AND v_couple_id != v_match.couple_b_id THEN
    RAISE EXCEPTION 'Esta pareja no participa en este partido';
  END IF;

  -- Must be unplayed
  IF v_match.status != 'scheduled' THEN
    RAISE EXCEPTION 'El partido no está pendiente de resultado';
  END IF;

  IF p_games_a = p_games_b THEN
    RAISE EXCEPTION 'El resultado no puede ser empate';
  END IF;

  UPDATE matches SET
    score_a      = p_games_a || '-' || p_games_b,
    score_b      = p_games_b || '-' || p_games_a,
    games_a      = p_games_a,
    games_b      = p_games_b,
    status       = 'pending_confirmation',
    submitted_by = v_couple_id
  WHERE id = p_match_id;
END;
$$;
GRANT EXECUTE ON FUNCTION submit_score_pin(UUID, TEXT, INT, INT) TO anon, authenticated;

-- ============================================================
-- 4. confirm_match_pin — confirm or dispute using a couple's PIN
--    Calls the existing confirm_match() for the confirm path
--    (which handles standings + bracket advancement).
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_match_pin(
  p_match_id UUID,
  p_pin      TEXT,
  p_action   TEXT   -- 'confirm' | 'dispute'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_couple_id UUID;
  v_match     matches%ROWTYPE;
BEGIN
  -- Resolve PIN → couple
  SELECT id INTO v_couple_id
  FROM couples
  WHERE login_pin = upper(trim(p_pin))
    AND login_pin IS NOT NULL;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'PIN inválido';
  END IF;

  -- Fetch match
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado';
  END IF;

  -- Must be pending confirmation
  IF v_match.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'El partido no está pendiente de confirmación';
  END IF;

  -- Must be a participant
  IF v_couple_id != v_match.couple_a_id AND v_couple_id != v_match.couple_b_id THEN
    RAISE EXCEPTION 'Esta pareja no participa en este partido';
  END IF;

  -- Cannot confirm your own submission
  IF v_couple_id = v_match.submitted_by THEN
    RAISE EXCEPTION 'No puedes confirmar tu propio resultado';
  END IF;

  IF p_action = 'confirm' THEN
    PERFORM confirm_match(p_match_id, NULL);
  ELSIF p_action = 'dispute' THEN
    UPDATE matches SET status = 'disputed' WHERE id = p_match_id;
  ELSE
    RAISE EXCEPTION 'Acción inválida: %', p_action;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION confirm_match_pin(UUID, TEXT, TEXT) TO anon, authenticated;
