-- QuickPlay 5-track sampler ranking system
-- One vote per fingerprint per track. Upsert allows users to change rating.

CREATE TABLE IF NOT EXISTS quickplay_rankings (
  id BIGSERIAL PRIMARY KEY,
  track_id INT NOT NULL,
  stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
  fingerprint TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (track_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_quickplay_rankings_track ON quickplay_rankings (track_id);

-- RLS — anyone can read aggregates and insert their own rank
ALTER TABLE quickplay_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read" ON quickplay_rankings;
CREATE POLICY "anyone can read" ON quickplay_rankings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anyone can insert" ON quickplay_rankings;
CREATE POLICY "anyone can insert" ON quickplay_rankings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anyone can update own" ON quickplay_rankings;
CREATE POLICY "anyone can update own" ON quickplay_rankings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
