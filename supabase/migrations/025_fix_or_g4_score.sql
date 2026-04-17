-- Migration 025: Fix Or G4 match score inversion
-- Match b07384b3: G. García / J. Pedrero (couple_a) vs R. Collado / P. Rubio (couple_b)
-- Wrong: 1-12 (R. Collado wins). Correct: 12-1 (G. García wins).

-- 1. Fix the match
UPDATE matches SET
  score_a      = '12-1',
  score_b      = '1-12',
  games_a      = 12,
  games_b      = 1,
  winner_id    = 'dab4550a-3dbd-410f-9c18-14ec35891894'  -- G. García / J. Pedrero
WHERE id = 'b07384b3-e121-4e90-babd-39bbdeffdb39';

-- 2. Fix standings for G. García / J. Pedrero (was loser, now winner)
UPDATE group_standings SET
  points            = 6,
  matches_won       = 2,
  matches_lost      = 1,
  games_for         = 20,
  games_against     = 12,
  game_differential = 8,
  updated_at        = now()
WHERE couple_id = 'dab4550a-3dbd-410f-9c18-14ec35891894'
  AND division   = 'or'
  AND group_code = 'G4';

-- 3. Fix standings for R. Collado / P. Rubio (was winner, now loser)
UPDATE group_standings SET
  points            = 0,
  matches_won       = 0,
  matches_lost      = 3,
  games_for         = 5,
  games_against     = 23,
  game_differential = -18,
  updated_at        = now()
WHERE couple_id = 'f4223d22-051c-4e77-8080-2e07a6c7719d'
  AND division   = 'or'
  AND group_code = 'G4';

-- 4. Recalculate ranks for Or G4
-- New order: ff768f51 (9pts), dab4550a (6pts), a52f9b63 (3pts, GD=0), f4223d22 (0pts)
UPDATE group_standings SET rank = 1 WHERE couple_id = 'ff768f51-49c8-4b4d-b7e5-ae2ac3b405e6' AND division = 'or' AND group_code = 'G4';
UPDATE group_standings SET rank = 2 WHERE couple_id = 'dab4550a-3dbd-410f-9c18-14ec35891894' AND division = 'or' AND group_code = 'G4';
UPDATE group_standings SET rank = 3 WHERE couple_id = 'a52f9b63-f443-41ee-9b15-8ef3c3953adb' AND division = 'or' AND group_code = 'G4';
UPDATE group_standings SET rank = 4 WHERE couple_id = 'f4223d22-051c-4e77-8080-2e07a6c7719d' AND division = 'or' AND group_code = 'G4';
