-- Migration 022: apply correct court/timeslot distribution for all Diamante groups
-- Source: new-court-distribution.csv (G2, G3) + calculated free-slot assignment (G1)
-- Required because migration 021 embedded an old placeholder schedule and the
-- CSV import (broken seed-based matching) never corrected the live DB values.
--
-- Diamante G1  — calculated from free Pistas 1-4 slots after G2/G3/Or/Plata:
--   R1 pos1 (1v2): 9:30h  Pista 1
--   R1 pos2 (3v4): 9:30h  Pista 4
--   R2 pos1 (1v3): 10:00h Pista 3
--   R2 pos2 (2v4): 10:00h Pista 4
--   R3 pos1 (1v4): 10:30h Pista 3   ← R3 unavoidably split; only one free court per slot
--   R3 pos2 (2v3): 11:00h Pista 1
--
-- Diamante G2  — from CSV:
--   R1 pos1: 9:30h  Pista 2 | R1 pos2: 10:00h Pista 1
--   R2 pos1: 10:30h Pista 1 | R2 pos2: 10:30h Pista 2
--   R3 pos1: 11:00h Pista 2 | R3 pos2: 11:00h Pista 3
--
-- Diamante G3  — from CSV:
--   R1 pos1: 9:30h  Pista 3 | R1 pos2: 10:00h Pista 2
--   R2 pos1: 10:30h Pista 4 | R2 pos2: 11:00h Pista 4
--   R3 pos1: 11:30h Pista 1 | R3 pos2: 11:30h Pista 2

-- ── Diamante G1 ───────────────────────────────────────────────
UPDATE matches SET court='Pista 1', court_label='A', time_slot='9:30h - 10:00h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R1' AND position=1;

UPDATE matches SET court='Pista 4', court_label='D', time_slot='9:30h - 10:00h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R1' AND position=2;

UPDATE matches SET court='Pista 3', court_label='C', time_slot='10:00h - 10:30h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R2' AND position=1;

UPDATE matches SET court='Pista 4', court_label='D', time_slot='10:00h - 10:30h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R2' AND position=2;

UPDATE matches SET court='Pista 3', court_label='C', time_slot='10:30h - 11:00h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R3' AND position=1;

UPDATE matches SET court='Pista 1', court_label='A', time_slot='11:00h - 11:30h'
WHERE phase='group' AND division='diamant' AND group_code='G1' AND round='R3' AND position=2;

-- ── Diamante G2 ───────────────────────────────────────────────
UPDATE matches SET court='Pista 2', court_label='B', time_slot='9:30h - 10:00h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R1' AND position=1;

UPDATE matches SET court='Pista 1', court_label='A', time_slot='10:00h - 10:30h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R1' AND position=2;

UPDATE matches SET court='Pista 1', court_label='A', time_slot='10:30h - 11:00h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R2' AND position=1;

UPDATE matches SET court='Pista 2', court_label='B', time_slot='10:30h - 11:00h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R2' AND position=2;

UPDATE matches SET court='Pista 2', court_label='B', time_slot='11:00h - 11:30h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R3' AND position=1;

UPDATE matches SET court='Pista 3', court_label='C', time_slot='11:00h - 11:30h'
WHERE phase='group' AND division='diamant' AND group_code='G2' AND round='R3' AND position=2;

-- ── Diamante G3 ───────────────────────────────────────────────
UPDATE matches SET court='Pista 3', court_label='C', time_slot='9:30h - 10:00h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R1' AND position=1;

UPDATE matches SET court='Pista 2', court_label='B', time_slot='10:00h - 10:30h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R1' AND position=2;

UPDATE matches SET court='Pista 4', court_label='D', time_slot='10:30h - 11:00h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R2' AND position=1;

UPDATE matches SET court='Pista 4', court_label='D', time_slot='11:00h - 11:30h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R2' AND position=2;

UPDATE matches SET court='Pista 1', court_label='A', time_slot='11:30h - 12:00h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R3' AND position=1;

UPDATE matches SET court='Pista 2', court_label='B', time_slot='11:30h - 12:00h'
WHERE phase='group' AND division='diamant' AND group_code='G3' AND round='R3' AND position=2;
