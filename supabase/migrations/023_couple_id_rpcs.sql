-- Migration 023: SECURITY DEFINER RPCs for email-based (non-PIN) devMode sessions
-- These mirror submit_score_pin / confirm_match_pin but accept couple_id directly.
-- Intended for players who authenticate via email match (no Supabase auth session).

-- ============================================================
-- 1. submit_score_couple_id
-- ============================================================
CREATE OR REPLACE FUNCTION submit_score_couple_id(
  p_match_id  UUID,
  p_couple_id UUID,
  p_games_a   INT,
  p_games_b   INT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado';
  END IF;

  IF p_couple_id != v_match.couple_a_id AND p_couple_id != v_match.couple_b_id THEN
    RAISE EXCEPTION 'Esta pareja no participa en este partido';
  END IF;

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
    submitted_by = p_couple_id
  WHERE id = p_match_id;
END;
$$;
GRANT EXECUTE ON FUNCTION submit_score_couple_id(UUID, UUID, INT, INT) TO anon, authenticated;

-- ============================================================
-- 2. confirm_match_couple_id
-- ============================================================
CREATE OR REPLACE FUNCTION confirm_match_couple_id(
  p_match_id  UUID,
  p_couple_id UUID,
  p_action    TEXT   -- 'confirm' | 'dispute'
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_match matches%ROWTYPE;
BEGIN
  SELECT * INTO v_match FROM matches WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado';
  END IF;

  IF v_match.status != 'pending_confirmation' THEN
    RAISE EXCEPTION 'El partido no está pendiente de confirmación';
  END IF;

  IF p_couple_id != v_match.couple_a_id AND p_couple_id != v_match.couple_b_id THEN
    RAISE EXCEPTION 'Esta pareja no participa en este partido';
  END IF;

  IF p_couple_id = v_match.submitted_by THEN
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
GRANT EXECUTE ON FUNCTION confirm_match_couple_id(UUID, UUID, TEXT) TO anon, authenticated;
