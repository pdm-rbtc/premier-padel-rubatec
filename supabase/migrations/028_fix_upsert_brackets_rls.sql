-- Migration 028: Explicitly disable row_security inside upsert_knockout_matches
-- Supabase applies RLS to postgres role; INSERTs have no non-admin policy so they're blocked.

CREATE OR REPLACE FUNCTION upsert_knockout_matches(p_matches JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m JSONB;
BEGIN
  SET LOCAL row_security = off;

  -- Pass 1: upsert all rows without next_match_id to avoid self-referential FK
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
      NULL,
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
      next_match_slot = EXCLUDED.next_match_slot,
      court           = EXCLUDED.court,
      court_label     = EXCLUDED.court_label,
      time_slot       = EXCLUDED.time_slot;
  END LOOP;

  -- Pass 2: wire up next_match_id links
  FOR m IN SELECT * FROM jsonb_array_elements(p_matches)
  LOOP
    UPDATE matches
    SET next_match_id = NULLIF(m->>'next_match_id', '')::UUID
    WHERE id = (m->>'id')::UUID;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION upsert_knockout_matches(JSONB) TO anon, authenticated;


-- Also fix clear_knockout_matches for the same reason
CREATE OR REPLACE FUNCTION clear_knockout_matches(p_division TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ids UUID[];
BEGIN
  SET LOCAL row_security = off;

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
