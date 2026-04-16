-- Migration 021: seed_group_matches() embeds court schedule + helper RPCs
-- Fixes:
--   1. seed_group_matches() now sets court/court_label/time_slot at creation time
--   2. relink_users_to_couples() RPC to re-fire trigger after CSV replace
--   3. Backfill court info on any existing matches that are still missing it

-- ============================================================
-- 1. Updated seed_group_matches() — includes court schedule
-- ============================================================
CREATE OR REPLACE FUNCTION seed_group_matches()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r       RECORD;
  c       UUID[];
  created INTEGER := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT division, group_code
    FROM couples
    WHERE group_code IS NOT NULL
    ORDER BY division, group_code
  LOOP
    -- Skip groups that already have matches
    IF EXISTS (
      SELECT 1 FROM matches
      WHERE phase = 'group' AND division = r.division AND group_code = r.group_code
    ) THEN
      CONTINUE;
    END IF;

    SELECT ARRAY_AGG(id ORDER BY COALESCE(seed, 9999), id::TEXT) INTO c
    FROM couples
    WHERE division = r.division AND group_code = r.group_code;

    IF array_length(c, 1) = 4 THEN
      -- Round-robin: R1=1v2,3v4  R2=1v3,2v4  R3=1v4,2v3
      -- Court/slot is looked up from embedded schedule (same mapping as migration 020)
      INSERT INTO matches
        (division, phase, group_code, round, position,
         couple_a_id, couple_b_id, status,
         court, court_label, time_slot)
      SELECT
        r.division, 'group', r.group_code,
        pairs.rnd, pairs.pos,
        pairs.a_id, pairs.b_id,
        'scheduled',
        sched.court, sched.court_label, sched.time_slot
      FROM (
        VALUES
          ('R1'::text, 1::int, c[1]::uuid, c[2]::uuid),
          ('R1'::text, 2::int, c[3]::uuid, c[4]::uuid),
          ('R2'::text, 1::int, c[1]::uuid, c[3]::uuid),
          ('R2'::text, 2::int, c[2]::uuid, c[4]::uuid),
          ('R3'::text, 1::int, c[1]::uuid, c[4]::uuid),
          ('R3'::text, 2::int, c[2]::uuid, c[3]::uuid)
      ) AS pairs(rnd, pos, a_id, b_id)
      LEFT JOIN (
        VALUES
          -- DIAMANT (Pista 1-4 / A-D)
          ('diamant'::text,'G1'::text,'R1'::text,1::int,'Pista 1','A','9:30h - 10:00h'),
          ('diamant','G1','R1',2,'Pista 2','B','9:30h - 10:00h'),
          ('diamant','G2','R1',1,'Pista 3','C','9:30h - 10:00h'),
          ('diamant','G2','R1',2,'Pista 4','D','9:30h - 10:00h'),
          ('diamant','G3','R1',1,'Pista 1','A','10:00h - 10:30h'),
          ('diamant','G3','R1',2,'Pista 2','B','10:00h - 10:30h'),
          ('diamant','G1','R2',1,'Pista 3','C','10:00h - 10:30h'),
          ('diamant','G1','R2',2,'Pista 4','D','10:00h - 10:30h'),
          ('diamant','G2','R2',1,'Pista 1','A','10:30h - 11:00h'),
          ('diamant','G2','R2',2,'Pista 2','B','10:30h - 11:00h'),
          ('diamant','G3','R2',1,'Pista 3','C','10:30h - 11:00h'),
          ('diamant','G3','R2',2,'Pista 4','D','10:30h - 11:00h'),
          ('diamant','G1','R3',1,'Pista 1','A','11:00h - 11:30h'),
          ('diamant','G1','R3',2,'Pista 2','B','11:00h - 11:30h'),
          ('diamant','G2','R3',1,'Pista 3','C','11:00h - 11:30h'),
          ('diamant','G2','R3',2,'Pista 4','D','11:00h - 11:30h'),
          ('diamant','G3','R3',1,'Pista 1','A','11:30h - 12:00h'),
          ('diamant','G3','R3',2,'Pista 2','B','11:30h - 12:00h'),
          -- OR (Pista 5-10 / E-J; P9-10 only in slots 4-6)
          ('or','G1','R1',1,'Pista 5','E','9:30h - 10:00h'),
          ('or','G1','R1',2,'Pista 6','F','9:30h - 10:00h'),
          ('or','G2','R1',1,'Pista 7','G','9:30h - 10:00h'),
          ('or','G2','R1',2,'Pista 8','H','9:30h - 10:00h'),
          ('or','G3','R1',1,'Pista 5','E','10:00h - 10:30h'),
          ('or','G3','R1',2,'Pista 6','F','10:00h - 10:30h'),
          ('or','G4','R1',1,'Pista 7','G','10:00h - 10:30h'),
          ('or','G4','R1',2,'Pista 8','H','10:00h - 10:30h'),
          ('or','G5','R1',1,'Pista 5','E','10:30h - 11:00h'),
          ('or','G5','R1',2,'Pista 6','F','10:30h - 11:00h'),
          ('or','G1','R2',1,'Pista 7','G','10:30h - 11:00h'),
          ('or','G1','R2',2,'Pista 8','H','10:30h - 11:00h'),
          ('or','G2','R2',1,'Pista 5','E','11:00h - 11:30h'),
          ('or','G2','R2',2,'Pista 6','F','11:00h - 11:30h'),
          ('or','G3','R2',1,'Pista 7','G','11:00h - 11:30h'),
          ('or','G3','R2',2,'Pista 8','H','11:00h - 11:30h'),
          ('or','G4','R2',1,'Pista 9','I','11:00h - 11:30h'),
          ('or','G4','R2',2,'Pista 10','J','11:00h - 11:30h'),
          ('or','G5','R2',1,'Pista 5','E','11:30h - 12:00h'),
          ('or','G5','R2',2,'Pista 6','F','11:30h - 12:00h'),
          ('or','G1','R3',1,'Pista 7','G','11:30h - 12:00h'),
          ('or','G1','R3',2,'Pista 8','H','11:30h - 12:00h'),
          ('or','G2','R3',1,'Pista 9','I','11:30h - 12:00h'),
          ('or','G2','R3',2,'Pista 10','J','11:30h - 12:00h'),
          ('or','G3','R3',1,'Pista 5','E','12:00h - 12:30h'),
          ('or','G3','R3',2,'Pista 6','F','12:00h - 12:30h'),
          ('or','G4','R3',1,'Pista 7','G','12:00h - 12:30h'),
          ('or','G4','R3',2,'Pista 8','H','12:00h - 12:30h'),
          ('or','G5','R3',1,'Pista 9','I','12:00h - 12:30h'),
          ('or','G5','R3',2,'Pista 10','J','12:00h - 12:30h'),
          -- PLATA (Pista 9-12 / I-L; P9-10 only in slots 1-3)
          ('plata','G1','R1',1,'Pista 9','I','9:30h - 10:00h'),
          ('plata','G1','R1',2,'Pista 10','J','9:30h - 10:00h'),
          ('plata','G2','R1',1,'Pista 11','K','9:30h - 10:00h'),
          ('plata','G2','R1',2,'Pista 12','L','9:30h - 10:00h'),
          ('plata','G3','R1',1,'Pista 9','I','10:00h - 10:30h'),
          ('plata','G3','R1',2,'Pista 10','J','10:00h - 10:30h'),
          ('plata','G1','R2',1,'Pista 11','K','10:00h - 10:30h'),
          ('plata','G1','R2',2,'Pista 12','L','10:00h - 10:30h'),
          ('plata','G2','R2',1,'Pista 9','I','10:30h - 11:00h'),
          ('plata','G2','R2',2,'Pista 10','J','10:30h - 11:00h'),
          ('plata','G3','R2',1,'Pista 11','K','10:30h - 11:00h'),
          ('plata','G3','R2',2,'Pista 12','L','10:30h - 11:00h'),
          ('plata','G1','R3',1,'Pista 11','K','11:00h - 11:30h'),
          ('plata','G1','R3',2,'Pista 12','L','11:00h - 11:30h'),
          ('plata','G2','R3',1,'Pista 11','K','11:30h - 12:00h'),
          ('plata','G2','R3',2,'Pista 12','L','11:30h - 12:00h'),
          ('plata','G3','R3',1,'Pista 11','K','12:00h - 12:30h'),
          ('plata','G3','R3',2,'Pista 12','L','12:00h - 12:30h')
      ) AS sched(sdiv, sgrp, srnd, spos, court, court_label, time_slot)
        ON sched.sdiv = r.division
       AND sched.sgrp = r.group_code
       AND sched.srnd = pairs.rnd
       AND sched.spos = pairs.pos;

      created := created + 6;
    END IF;
  END LOOP;
  RETURN created;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_group_matches() TO authenticated;

-- ============================================================
-- 2. relink_users_to_couples() — re-fires tr_link_user_to_couple
--    for all existing users (use after CSV replace import)
-- ============================================================
CREATE OR REPLACE FUNCTION relink_users_to_couples()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.users SET email = email WHERE email IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION relink_users_to_couples() TO authenticated;

-- ============================================================
-- 3. Backfill courts on any existing group matches missing them
-- ============================================================
UPDATE matches AS m
SET court       = schedule.court,
    court_label = schedule.court_label,
    time_slot   = schedule.time_slot
FROM (VALUES
  ('diamant','G1','R1',1,'Pista 1' ,'A','9:30h - 10:00h'),
  ('diamant','G1','R1',2,'Pista 2' ,'B','9:30h - 10:00h'),
  ('diamant','G2','R1',1,'Pista 3' ,'C','9:30h - 10:00h'),
  ('diamant','G2','R1',2,'Pista 4' ,'D','9:30h - 10:00h'),
  ('diamant','G3','R1',1,'Pista 1' ,'A','10:00h - 10:30h'),
  ('diamant','G3','R1',2,'Pista 2' ,'B','10:00h - 10:30h'),
  ('diamant','G1','R2',1,'Pista 3' ,'C','10:00h - 10:30h'),
  ('diamant','G1','R2',2,'Pista 4' ,'D','10:00h - 10:30h'),
  ('diamant','G2','R2',1,'Pista 1' ,'A','10:30h - 11:00h'),
  ('diamant','G2','R2',2,'Pista 2' ,'B','10:30h - 11:00h'),
  ('diamant','G3','R2',1,'Pista 3' ,'C','10:30h - 11:00h'),
  ('diamant','G3','R2',2,'Pista 4' ,'D','10:30h - 11:00h'),
  ('diamant','G1','R3',1,'Pista 1' ,'A','11:00h - 11:30h'),
  ('diamant','G1','R3',2,'Pista 2' ,'B','11:00h - 11:30h'),
  ('diamant','G2','R3',1,'Pista 3' ,'C','11:00h - 11:30h'),
  ('diamant','G2','R3',2,'Pista 4' ,'D','11:00h - 11:30h'),
  ('diamant','G3','R3',1,'Pista 1' ,'A','11:30h - 12:00h'),
  ('diamant','G3','R3',2,'Pista 2' ,'B','11:30h - 12:00h'),
  ('or','G1','R1',1,'Pista 5' ,'E','9:30h - 10:00h'),
  ('or','G1','R1',2,'Pista 6' ,'F','9:30h - 10:00h'),
  ('or','G2','R1',1,'Pista 7' ,'G','9:30h - 10:00h'),
  ('or','G2','R1',2,'Pista 8' ,'H','9:30h - 10:00h'),
  ('or','G3','R1',1,'Pista 5' ,'E','10:00h - 10:30h'),
  ('or','G3','R1',2,'Pista 6' ,'F','10:00h - 10:30h'),
  ('or','G4','R1',1,'Pista 7' ,'G','10:00h - 10:30h'),
  ('or','G4','R1',2,'Pista 8' ,'H','10:00h - 10:30h'),
  ('or','G5','R1',1,'Pista 5' ,'E','10:30h - 11:00h'),
  ('or','G5','R1',2,'Pista 6' ,'F','10:30h - 11:00h'),
  ('or','G1','R2',1,'Pista 7' ,'G','10:30h - 11:00h'),
  ('or','G1','R2',2,'Pista 8' ,'H','10:30h - 11:00h'),
  ('or','G2','R2',1,'Pista 5' ,'E','11:00h - 11:30h'),
  ('or','G2','R2',2,'Pista 6' ,'F','11:00h - 11:30h'),
  ('or','G3','R2',1,'Pista 7' ,'G','11:00h - 11:30h'),
  ('or','G3','R2',2,'Pista 8' ,'H','11:00h - 11:30h'),
  ('or','G4','R2',1,'Pista 9' ,'I','11:00h - 11:30h'),
  ('or','G4','R2',2,'Pista 10','J','11:00h - 11:30h'),
  ('or','G5','R2',1,'Pista 5' ,'E','11:30h - 12:00h'),
  ('or','G5','R2',2,'Pista 6' ,'F','11:30h - 12:00h'),
  ('or','G1','R3',1,'Pista 7' ,'G','11:30h - 12:00h'),
  ('or','G1','R3',2,'Pista 8' ,'H','11:30h - 12:00h'),
  ('or','G2','R3',1,'Pista 9' ,'I','11:30h - 12:00h'),
  ('or','G2','R3',2,'Pista 10','J','11:30h - 12:00h'),
  ('or','G3','R3',1,'Pista 5' ,'E','12:00h - 12:30h'),
  ('or','G3','R3',2,'Pista 6' ,'F','12:00h - 12:30h'),
  ('or','G4','R3',1,'Pista 7' ,'G','12:00h - 12:30h'),
  ('or','G4','R3',2,'Pista 8' ,'H','12:00h - 12:30h'),
  ('or','G5','R3',1,'Pista 9' ,'I','12:00h - 12:30h'),
  ('or','G5','R3',2,'Pista 10','J','12:00h - 12:30h'),
  ('plata','G1','R1',1,'Pista 9' ,'I','9:30h - 10:00h'),
  ('plata','G1','R1',2,'Pista 10','J','9:30h - 10:00h'),
  ('plata','G2','R1',1,'Pista 11','K','9:30h - 10:00h'),
  ('plata','G2','R1',2,'Pista 12','L','9:30h - 10:00h'),
  ('plata','G3','R1',1,'Pista 9' ,'I','10:00h - 10:30h'),
  ('plata','G3','R1',2,'Pista 10','J','10:00h - 10:30h'),
  ('plata','G1','R2',1,'Pista 11','K','10:00h - 10:30h'),
  ('plata','G1','R2',2,'Pista 12','L','10:00h - 10:30h'),
  ('plata','G2','R2',1,'Pista 9' ,'I','10:30h - 11:00h'),
  ('plata','G2','R2',2,'Pista 10','J','10:30h - 11:00h'),
  ('plata','G3','R2',1,'Pista 11','K','10:30h - 11:00h'),
  ('plata','G3','R2',2,'Pista 12','L','10:30h - 11:00h'),
  ('plata','G1','R3',1,'Pista 11','K','11:00h - 11:30h'),
  ('plata','G1','R3',2,'Pista 12','L','11:00h - 11:30h'),
  ('plata','G2','R3',1,'Pista 11','K','11:30h - 12:00h'),
  ('plata','G2','R3',2,'Pista 12','L','11:30h - 12:00h'),
  ('plata','G3','R3',1,'Pista 11','K','12:00h - 12:30h'),
  ('plata','G3','R3',2,'Pista 12','L','12:00h - 12:30h')
) AS schedule(division, group_code, round, position, court, court_label, time_slot)
WHERE m.division    = schedule.division
  AND m.group_code  = schedule.group_code
  AND m.round       = schedule.round
  AND m.position    = schedule.position
  AND m.phase       = 'group'
  AND m.court       IS NULL;
