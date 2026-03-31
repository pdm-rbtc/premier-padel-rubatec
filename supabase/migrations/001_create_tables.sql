-- 001_create_tables.sql

CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  player_1_name TEXT NOT NULL,
  player_2_name TEXT NOT NULL,
  division TEXT NOT NULL CHECK (division IN ('diamant', 'or', 'plata')),
  group_code TEXT,
  seed INTEGER,
  image_url TEXT,
  centre TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  couple_id UUID REFERENCES couples(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division TEXT NOT NULL CHECK (division IN ('diamant', 'or', 'plata')),
  phase TEXT NOT NULL CHECK (phase IN ('group', 'knockout')),
  group_code TEXT,
  round TEXT,
  position INTEGER,
  couple_a_id UUID REFERENCES couples(id),
  couple_b_id UUID REFERENCES couples(id),
  score_a TEXT,
  score_b TEXT,
  games_a INTEGER DEFAULT 0,
  games_b INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES couples(id),
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'pending_confirmation', 'confirmed', 'disputed', 'bye', 'walkover')),
  winner_id UUID REFERENCES couples(id),
  court TEXT,
  court_label CHAR(1),
  scheduled_at TIMESTAMPTZ,
  time_slot TEXT,
  confirmed_at TIMESTAMPTZ,
  next_match_id UUID REFERENCES matches(id),
  next_match_slot TEXT CHECK (next_match_slot IN ('couple_a', 'couple_b')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) NOT NULL,
  division TEXT NOT NULL,
  group_code TEXT NOT NULL,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  games_for INTEGER DEFAULT 0,
  games_against INTEGER DEFAULT 0,
  game_differential INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(couple_id, division, group_code)
);

CREATE TABLE IF NOT EXISTS match_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'score_submitted', 'score_confirmed', 'score_disputed',
    'admin_override', 'bracket_advanced', 'status_changed'
  )),
  actor_id UUID REFERENCES users(id),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
