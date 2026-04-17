-- Migration 027: Fix upsert_knockout_matches — two-pass insert to avoid
-- self-referential FK violation on next_match_id.
-- Pass 1: insert all rows with next_match_id = NULL
-- Pass 2: set next_match_id links once all rows exist

CREATE OR REPLACE FUNCTION upsert_knockout_matches(p_matches JSONB)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  m JSONB;
BEGIN
  -- Pass 1: upsert all rows without next_match_id
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

  -- Pass 2: now all rows exist, wire up next_match_id
  FOR m IN SELECT * FROM jsonb_array_elements(p_matches)
  LOOP
    UPDATE matches
    SET next_match_id = NULLIF(m->>'next_match_id', '')::UUID
    WHERE id = (m->>'id')::UUID;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION upsert_knockout_matches(JSONB) TO anon, authenticated;
