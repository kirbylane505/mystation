-- QuickPlay V2: add volume attribution to events + rankings.
-- Lets multiple QuickPlay volumes (vol-1, vol-2, ...) share the same tables
-- while analytics can still separate drops by volume slug.
--
-- Safe to run repeatedly. Existing rows default to vol-1 since that was
-- the only volume before this migration.

ALTER TABLE quickplay_events
  ADD COLUMN IF NOT EXISTS volume TEXT DEFAULT 'vol-1';

CREATE INDEX IF NOT EXISTS idx_qp_events_volume
  ON quickplay_events (volume);

ALTER TABLE quickplay_rankings
  ADD COLUMN IF NOT EXISTS volume TEXT DEFAULT 'vol-1';

-- Rankings uniqueness is still per (track_id, fingerprint). A listener who
-- rates the SAME track across two volumes only counts once, which is the
-- intent — rating is about the track, volume just tags where they heard it.

CREATE INDEX IF NOT EXISTS idx_qp_rankings_volume
  ON quickplay_rankings (volume);
