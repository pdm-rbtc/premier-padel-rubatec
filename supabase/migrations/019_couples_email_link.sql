-- Migration 019: Add email columns to couples, backfill from players, fix auth trigger

-- ============================================================
-- 1. Add email columns (safe — IF NOT EXISTS)
-- ============================================================
ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS player_1_email TEXT,
  ADD COLUMN IF NOT EXISTS player_2_email TEXT;

-- ============================================================
-- 2. Backfill via FK (couples that already have player IDs)
-- ============================================================
UPDATE couples c
SET player_1_email = p.email
FROM players p
WHERE c.player_1_id    = p.id
  AND c.player_1_email IS NULL
  AND p.email IS NOT NULL;

UPDATE couples c
SET player_2_email = p.email
FROM players p
WHERE c.player_2_id    = p.id
  AND c.player_2_email IS NULL
  AND p.email IS NOT NULL;

-- ============================================================
-- 3. Backfill via name match (CSV-imported couples — no IDs set)
--    Also fills player_1_id / player_2_id for future use.
-- ============================================================
UPDATE couples c
SET player_1_email = p.email,
    player_1_id    = p.id
FROM players p
WHERE c.player_1_id    IS NULL
  AND c.player_1_email IS NULL
  AND p.email IS NOT NULL
  AND lower(trim(c.player_1_name)) = lower(trim(p.first_name || ' ' || p.last_name));

UPDATE couples c
SET player_2_email = p.email,
    player_2_id    = p.id
FROM players p
WHERE c.player_2_id    IS NULL
  AND c.player_2_email IS NULL
  AND p.email IS NOT NULL
  AND lower(trim(c.player_2_name)) = lower(trim(p.first_name || ' ' || p.last_name));

-- ============================================================
-- 4. Update fn_link_user_to_couple to also check email columns
-- ============================================================
CREATE OR REPLACE FUNCTION fn_link_user_to_couple()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_player_id UUID;
  v_couple_id UUID;
BEGIN
  -- Path A: players table → couple FK
  SELECT id INTO v_player_id FROM players WHERE email = NEW.email;
  IF v_player_id IS NOT NULL THEN
    SELECT id INTO v_couple_id FROM couples
    WHERE player_1_id = v_player_id OR player_2_id = v_player_id
    LIMIT 1;
  END IF;

  -- Path B: direct email columns on couples (CSV-imported, no FK)
  IF v_couple_id IS NULL THEN
    SELECT id INTO v_couple_id FROM couples
    WHERE player_1_email = NEW.email OR player_2_email = NEW.email
    LIMIT 1;
  END IF;

  IF v_couple_id IS NOT NULL THEN
    NEW.couple_id := v_couple_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. Re-fire trigger for all existing users (links anyone
--    whose couple_id was previously null)
-- ============================================================
UPDATE public.users SET email = email WHERE email IS NOT NULL;
