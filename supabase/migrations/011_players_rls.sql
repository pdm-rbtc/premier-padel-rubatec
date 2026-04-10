-- Migration 011: Enable RLS on players table (created in 010 after RLS migration)

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for dev mode email lookup and auth trigger)
DROP POLICY IF EXISTS "public_read_players" ON players;
CREATE POLICY "public_read_players" ON players FOR SELECT USING (true);

-- Admins have full access
DROP POLICY IF EXISTS "admin_all_players" ON players;
CREATE POLICY "admin_all_players" ON players FOR ALL
  USING (auth.jwt() ->> 'email' IN ('pdemora@rubatec.cat','ggarcia@rubatec.cat','ssomavilla@rubatec.cat','sgarcia@rubatec.cat'));
