-- 007_enable_realtime.sql
-- Expose matches and group_standings to Supabase Realtime

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'group_standings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_standings;
  END IF;
END $$;
