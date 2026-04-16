-- Migration 020: Assign courts and time slots to all group-phase matches
-- Schedule derived from official court distribution PDF.
--
-- Court ranges:
--   Diamant : Pista 1–4  (A–D), slots 1–5  (9:30–12:00h)
--   Or      : Pista 5–10 (E–J), slots 1–6  (9:30–12:30h)
--   Plata   : Pista 9–12 (I–L), slots 1–6  (9:30–12:30h)
--   Pista 9–10 shared: Plata uses slots 1–3, Or uses slots 4–6 (no conflict)

UPDATE matches AS m
SET court       = schedule.court,
    court_label = schedule.court_label,
    time_slot   = schedule.time_slot
FROM (VALUES
  -- ──────────────────────────────────────────────────────────────────
  -- DIAMANT  (Pista 1–4 / A–D, slots 1–5)
  -- ──────────────────────────────────────────────────────────────────
  -- Slot 1 (9:30–10:00): G1-R1 on P1+P2, G2-R1 on P3+P4
  ('diamant','G1','R1',1,'Pista 1' ,'A','9:30h - 10:00h'),
  ('diamant','G1','R1',2,'Pista 2' ,'B','9:30h - 10:00h'),
  ('diamant','G2','R1',1,'Pista 3' ,'C','9:30h - 10:00h'),
  ('diamant','G2','R1',2,'Pista 4' ,'D','9:30h - 10:00h'),
  -- Slot 2 (10:00–10:30): G3-R1 on P1+P2, G1-R2 on P3+P4
  ('diamant','G3','R1',1,'Pista 1' ,'A','10:00h - 10:30h'),
  ('diamant','G3','R1',2,'Pista 2' ,'B','10:00h - 10:30h'),
  ('diamant','G1','R2',1,'Pista 3' ,'C','10:00h - 10:30h'),
  ('diamant','G1','R2',2,'Pista 4' ,'D','10:00h - 10:30h'),
  -- Slot 3 (10:30–11:00): G2-R2 on P1+P2, G3-R2 on P3+P4
  ('diamant','G2','R2',1,'Pista 1' ,'A','10:30h - 11:00h'),
  ('diamant','G2','R2',2,'Pista 2' ,'B','10:30h - 11:00h'),
  ('diamant','G3','R2',1,'Pista 3' ,'C','10:30h - 11:00h'),
  ('diamant','G3','R2',2,'Pista 4' ,'D','10:30h - 11:00h'),
  -- Slot 4 (11:00–11:30): G1-R3 on P1+P2, G2-R3 on P3+P4
  ('diamant','G1','R3',1,'Pista 1' ,'A','11:00h - 11:30h'),
  ('diamant','G1','R3',2,'Pista 2' ,'B','11:00h - 11:30h'),
  ('diamant','G2','R3',1,'Pista 3' ,'C','11:00h - 11:30h'),
  ('diamant','G2','R3',2,'Pista 4' ,'D','11:00h - 11:30h'),
  -- Slot 5 (11:30–12:00): G3-R3 on P1+P2
  ('diamant','G3','R3',1,'Pista 1' ,'A','11:30h - 12:00h'),
  ('diamant','G3','R3',2,'Pista 2' ,'B','11:30h - 12:00h'),

  -- ──────────────────────────────────────────────────────────────────
  -- OR  (Pista 5–10 / E–J, slots 1–6; P9–10 only in slots 4–6)
  -- ──────────────────────────────────────────────────────────────────
  -- Slot 1 (9:30–10:00): G1-R1 on P5+P6, G2-R1 on P7+P8
  ('or','G1','R1',1,'Pista 5' ,'E','9:30h - 10:00h'),
  ('or','G1','R1',2,'Pista 6' ,'F','9:30h - 10:00h'),
  ('or','G2','R1',1,'Pista 7' ,'G','9:30h - 10:00h'),
  ('or','G2','R1',2,'Pista 8' ,'H','9:30h - 10:00h'),
  -- Slot 2 (10:00–10:30): G3-R1 on P5+P6, G4-R1 on P7+P8
  ('or','G3','R1',1,'Pista 5' ,'E','10:00h - 10:30h'),
  ('or','G3','R1',2,'Pista 6' ,'F','10:00h - 10:30h'),
  ('or','G4','R1',1,'Pista 7' ,'G','10:00h - 10:30h'),
  ('or','G4','R1',2,'Pista 8' ,'H','10:00h - 10:30h'),
  -- Slot 3 (10:30–11:00): G5-R1 on P5+P6, G1-R2 on P7+P8
  ('or','G5','R1',1,'Pista 5' ,'E','10:30h - 11:00h'),
  ('or','G5','R1',2,'Pista 6' ,'F','10:30h - 11:00h'),
  ('or','G1','R2',1,'Pista 7' ,'G','10:30h - 11:00h'),
  ('or','G1','R2',2,'Pista 8' ,'H','10:30h - 11:00h'),
  -- Slot 4 (11:00–11:30): G2-R2 on P5+P6, G3-R2 on P7+P8, G4-R2 on P9+P10
  ('or','G2','R2',1,'Pista 5' ,'E','11:00h - 11:30h'),
  ('or','G2','R2',2,'Pista 6' ,'F','11:00h - 11:30h'),
  ('or','G3','R2',1,'Pista 7' ,'G','11:00h - 11:30h'),
  ('or','G3','R2',2,'Pista 8' ,'H','11:00h - 11:30h'),
  ('or','G4','R2',1,'Pista 9' ,'I','11:00h - 11:30h'),
  ('or','G4','R2',2,'Pista 10','J','11:00h - 11:30h'),
  -- Slot 5 (11:30–12:00): G5-R2 on P5+P6, G1-R3 on P7+P8, G2-R3 on P9+P10
  ('or','G5','R2',1,'Pista 5' ,'E','11:30h - 12:00h'),
  ('or','G5','R2',2,'Pista 6' ,'F','11:30h - 12:00h'),
  ('or','G1','R3',1,'Pista 7' ,'G','11:30h - 12:00h'),
  ('or','G1','R3',2,'Pista 8' ,'H','11:30h - 12:00h'),
  ('or','G2','R3',1,'Pista 9' ,'I','11:30h - 12:00h'),
  ('or','G2','R3',2,'Pista 10','J','11:30h - 12:00h'),
  -- Slot 6 (12:00–12:30): G3-R3 on P5+P6, G4-R3 on P7+P8, G5-R3 on P9+P10
  ('or','G3','R3',1,'Pista 5' ,'E','12:00h - 12:30h'),
  ('or','G3','R3',2,'Pista 6' ,'F','12:00h - 12:30h'),
  ('or','G4','R3',1,'Pista 7' ,'G','12:00h - 12:30h'),
  ('or','G4','R3',2,'Pista 8' ,'H','12:00h - 12:30h'),
  ('or','G5','R3',1,'Pista 9' ,'I','12:00h - 12:30h'),
  ('or','G5','R3',2,'Pista 10','J','12:00h - 12:30h'),

  -- ──────────────────────────────────────────────────────────────────
  -- PLATA  (Pista 9–12 / I–L, slots 1–6; P9–10 only in slots 1–3)
  -- ──────────────────────────────────────────────────────────────────
  -- Slot 1 (9:30–10:00): G1-R1 on P9+P10, G2-R1 on P11+P12
  ('plata','G1','R1',1,'Pista 9' ,'I','9:30h - 10:00h'),
  ('plata','G1','R1',2,'Pista 10','J','9:30h - 10:00h'),
  ('plata','G2','R1',1,'Pista 11','K','9:30h - 10:00h'),
  ('plata','G2','R1',2,'Pista 12','L','9:30h - 10:00h'),
  -- Slot 2 (10:00–10:30): G3-R1 on P9+P10, G1-R2 on P11+P12
  ('plata','G3','R1',1,'Pista 9' ,'I','10:00h - 10:30h'),
  ('plata','G3','R1',2,'Pista 10','J','10:00h - 10:30h'),
  ('plata','G1','R2',1,'Pista 11','K','10:00h - 10:30h'),
  ('plata','G1','R2',2,'Pista 12','L','10:00h - 10:30h'),
  -- Slot 3 (10:30–11:00): G2-R2 on P9+P10, G3-R2 on P11+P12
  ('plata','G2','R2',1,'Pista 9' ,'I','10:30h - 11:00h'),
  ('plata','G2','R2',2,'Pista 10','J','10:30h - 11:00h'),
  ('plata','G3','R2',1,'Pista 11','K','10:30h - 11:00h'),
  ('plata','G3','R2',2,'Pista 12','L','10:30h - 11:00h'),
  -- Slot 4 (11:00–11:30): G1-R3 on P11+P12  (P9–10 occupied by Or)
  ('plata','G1','R3',1,'Pista 11','K','11:00h - 11:30h'),
  ('plata','G1','R3',2,'Pista 12','L','11:00h - 11:30h'),
  -- Slot 5 (11:30–12:00): G2-R3 on P11+P12  (P9–10 occupied by Or)
  ('plata','G2','R3',1,'Pista 11','K','11:30h - 12:00h'),
  ('plata','G2','R3',2,'Pista 12','L','11:30h - 12:00h'),
  -- Slot 6 (12:00–12:30): G3-R3 on P11+P12  (P9–10 occupied by Or)
  ('plata','G3','R3',1,'Pista 11','K','12:00h - 12:30h'),
  ('plata','G3','R3',2,'Pista 12','L','12:00h - 12:30h')

) AS schedule(division, group_code, round, position, court, court_label, time_slot)
WHERE m.division   = schedule.division
  AND m.group_code = schedule.group_code
  AND m.round      = schedule.round
  AND m.position   = schedule.position
  AND m.phase      = 'group';

-- ──────────────────────────────────────────────────────────────────────────────
-- Ensure group_standings rows exist for all couples with a group assignment.
-- Uses INSERT … ON CONFLICT DO NOTHING so re-running is safe.
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO group_standings (couple_id, division, group_code)
SELECT id, division, group_code
FROM   couples
WHERE  group_code IS NOT NULL
ON CONFLICT (couple_id, division, group_code) DO NOTHING;
