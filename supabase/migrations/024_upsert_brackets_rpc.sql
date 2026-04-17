-- Migration 024: SECURITY DEFINER RPC for bracket generation
-- Allows admin devMode sessions (no Supabase JWT) to upsert knockout matches.

CREATE OR REPLACE FUNCTION upsert_knockout_matches(p_matches JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  m JSONB;
BEGIN
  FOR m IN SELECT * FROM jsonb_array_elements(p_matches)
  LOOP
    INSERT INTO matches (
      id, division, phase, round, position,
      couple_a_id, couple_b_id, status,
      next_match_id, next_match_slot,
      court, court_label, time_slot
    ) VALUES (
      (m->>'id')::UUID,
       m->>'division',
       m->>'phase',
       m->>'round',
      (m->>'position')::INTEGER,
      NULLIF(m->>'couple_a_id', '')::UUID,
      NULLIF(m->>'couple_b_id', '')::UUID,
       COALESCE(m->>'status', 'scheduled'),
      NULLIF(m->>'next_match_id', '')::UUID,
      NULLIF(m->>'next_match_slot', ''),
      NULLIF(m->>'court', ''),
      NULLIF(m->>'court_label', '')::CHAR(1),
      NULLIF(m->>'time_slot', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      division        = EXCLUDED.division,
      phase           = EXCLUDED.phase,
      round           = EXCLUDED.round,
      position        = EXCLUDED.position,
      couple_a_id     = EXCLUDED.couple_a_id,
      couple_b_id     = EXCLUDED.couple_b_id,
      status          = EXCLUDED.status,
      next_match_id   = EXCLUDED.next_match_id,
      next_match_slot = EXCLUDED.next_match_slot,
      court           = EXCLUDED.court,
      court_label     = EXCLUDED.court_label,
      time_slot       = EXCLUDED.time_slot;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION upsert_knockout_matches(JSONB) TO anon, authenticated;

-- ============================================================
-- clear_knockout_matches — delete all knockout matches + their logs
-- ============================================================
CREATE OR REPLACE FUNCTION clear_knockout_matches(p_division TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ids UUID[];
BEGIN
  SELECT ARRAY(
    SELECT id FROM matches
    WHERE division = p_division AND phase = 'knockout'
  ) INTO v_ids;

  IF array_length(v_ids, 1) > 0 THEN
    DELETE FROM match_log WHERE match_id = ANY(v_ids);
  END IF;

  DELETE FROM matches WHERE division = p_division AND phase = 'knockout';
END;
$$;
GRANT EXECUTE ON FUNCTION clear_knockout_matches(TEXT) TO anon, authenticated;
