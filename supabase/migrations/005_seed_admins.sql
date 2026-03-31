-- 005_seed_admins.sql
-- Admin emails are controlled via RLS policies; no seed needed for auth.users
-- This file is a placeholder for any future seed data

INSERT INTO tournament_config (key, value) VALUES
  ('tournament_name', '"3r Torneo Premium Pádel Rubatec"'),
  ('tournament_date', '"2026-04-00"'),
  ('status', '"setup"')
ON CONFLICT (key) DO NOTHING;
