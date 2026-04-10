-- Migration 013: Prepend first-name initial to each half of team_name
-- e.g. 'Delgado / Majeed' + player names 'Edgar Delgado'/'Aaron Majeed'
--   → 'E. Delgado / A. Majeed'

UPDATE couples
SET team_name =
  LEFT(player_1_name, 1) || '. ' || split_part(team_name, ' / ', 1)
  || ' / ' ||
  LEFT(player_2_name, 1) || '. ' || split_part(team_name, ' / ', 2)
WHERE player_1_name IS NOT NULL
  AND player_2_name IS NOT NULL
  AND team_name LIKE '% / %'
  AND team_name NOT LIKE '_. % / _. %';  -- skip if already has initials
