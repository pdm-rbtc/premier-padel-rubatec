-- 003_rls_policies.sql

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_config ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public_read_couples" ON couples FOR SELECT USING (true);
CREATE POLICY "public_read_matches" ON matches FOR SELECT USING (true);
CREATE POLICY "public_read_standings" ON group_standings FOR SELECT USING (true);
CREATE POLICY "public_read_config" ON tournament_config FOR SELECT USING (true);

-- Players can read their own user record
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);

-- Players can update match scores only for their own matches
CREATE POLICY "players_submit_score" ON matches FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    status IN ('scheduled', 'pending_confirmation') AND
    (couple_a_id IN (SELECT couple_id FROM users WHERE id = auth.uid()) OR
     couple_b_id IN (SELECT couple_id FROM users WHERE id = auth.uid()))
  );

-- Admins have full access
CREATE POLICY "admin_all_couples" ON couples FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
CREATE POLICY "admin_all_matches" ON matches FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
CREATE POLICY "admin_all_standings" ON group_standings FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
CREATE POLICY "admin_all_users" ON users FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
CREATE POLICY "admin_all_log" ON match_log FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
CREATE POLICY "admin_all_config" ON tournament_config FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
