-- MYSTATION — hi-fi audio column for Premium tier (dormant until month-7 flip)
-- Apply via: ../../../../tools/supabase-sql.sh < src/lib/db/migrations/2026-04-17-hi-fi-column.sql
-- NOT YET APPLIED to prod. Safe to apply early — column is nullable.

ALTER TABLE tracks ADD COLUMN IF NOT EXISTS audio_url_hifi TEXT;
