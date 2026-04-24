-- QuickPlay visitor + play tracking events.
-- Records every page view, play_all, play_track, and rank action on /quickplay.

CREATE TABLE IF NOT EXISTS quickplay_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'play_all', 'play_track', 'rank', 'share')),
  track_id INT,
  stars INT,
  fingerprint TEXT,
  ip_hash TEXT,
  ip_prefix TEXT,
  user_agent TEXT,
  device_type TEXT,
  referrer TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qp_events_created ON quickplay_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qp_events_type ON quickplay_events (event_type);
CREATE INDEX IF NOT EXISTS idx_qp_events_fingerprint ON quickplay_events (fingerprint);

ALTER TABLE quickplay_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon can insert" ON quickplay_events;
CREATE POLICY "anon can insert" ON quickplay_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Reads are restricted; admin API uses service role to bypass RLS
DROP POLICY IF EXISTS "service only read" ON quickplay_events;
CREATE POLICY "service only read" ON quickplay_events
  FOR SELECT USING (false);
