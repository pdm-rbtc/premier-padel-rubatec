-- Migration 026: Revert migration 025 — restore original Or G4 score
-- G. García / J. Pedrero (couple_a) 1-12, R. Collado / P. Rubio (couple_b) wins

UPDATE matches SET
  score_a   = '1-12',
  score_b   = '12-1',
  games_a   = 1,
  games_b   = 12,
  winner_id = 'f4223d22-051c-4e77-8080-2e07a6c7719d'  -- R. Collado / P. Rubio
WHERE id = 'b07384b3-e121-4e90-babd-39bbdeffdb39';

UPDATE group_standings SET
  points = 3, matches_won = 1, matches_lost = 2,
  games_for = 9, games_against = 23, game_differential = -14, rank = 4, updated_at = now()
WHERE couple_id = 'dab4550a-3dbd-410f-9c18-14ec35891894' AND division = 'or' AND group_code = 'G4';

UPDATE group_standings SET
  points = 3, matches_won = 1, matches_lost = 2,
  games_for = 16, games_against = 12, game_differential = 4, rank = 2, updated_at = now()
WHERE couple_id = 'f4223d22-051c-4e77-8080-2e07a6c7719d' AND division = 'or' AND group_code = 'G4';
