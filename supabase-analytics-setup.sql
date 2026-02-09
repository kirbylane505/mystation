-- MYSTATION Analytics Events Table
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS analytics_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,           -- 'play', 'page_view', 'purchase'
  track_id text,
  track_title text,
  page_path text,
  session_id text,
  ip_hash text,
  city text,
  region text,                         -- state/province code
  country text,                        -- country code
  device_type text,                    -- 'mobile', 'tablet', 'desktop'
  user_agent text,
  referrer text,
  amount_cents integer,                -- for purchase events
  created_at timestamptz DEFAULT now()
);

-- Index for daily queries (most common access pattern)
CREATE INDEX idx_analytics_created_at ON analytics_events (created_at DESC);
CREATE INDEX idx_analytics_event_type ON analytics_events (event_type, created_at DESC);

-- RLS: Allow anyone to INSERT (client-side tracking), no public SELECT
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- No SELECT policy = service role key required to read (admin only)
