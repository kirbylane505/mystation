-- MYSTATION — hi-fi audio column for Premium tier (dormant until month-7 flip)
-- Apply via: ../../../../tools/supabase-sql.sh < src/lib/db/migrations/2026-04-17-hi-fi-column.sql
-- APPLIED to prod 2026-04-18 on creator_tracks (the actual dynamic tracks table).
-- Static catalog tracks live in src/data/tracks.js and do not need DB changes.

ALTER TABLE creator_tracks ADD COLUMN IF NOT EXISTS audio_url_hifi TEXT;
