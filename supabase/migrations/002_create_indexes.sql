-- 002_create_indexes.sql

CREATE INDEX IF NOT EXISTS idx_matches_division_phase ON matches(division, phase);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(division, group_code);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_couple_a ON matches(couple_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_couple_b ON matches(couple_b_id);
CREATE INDEX IF NOT EXISTS idx_standings_group ON group_standings(division, group_code);
CREATE INDEX IF NOT EXISTS idx_match_log_match ON match_log(match_id);
