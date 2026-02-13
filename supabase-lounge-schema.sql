-- =============================================
-- KICKBACK LOUNGE — Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Game Rooms
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  game_type text NOT NULL CHECK (game_type IN ('blackjack', 'slidesLadders', 'spades', 'dominos', 'poker', 'pool')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  host_id text NOT NULL,
  host_name text NOT NULL DEFAULT 'Host',
  settings jsonb DEFAULT '{}',
  max_players int NOT NULL DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_code ON game_rooms(code);

-- 2. Game Players (who's in each room)
CREATE TABLE IF NOT EXISTS game_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  display_name text NOT NULL DEFAULT 'Player',
  seat int NOT NULL DEFAULT 0,
  team int,
  score int DEFAULT 0,
  ready boolean DEFAULT false,
  connected boolean DEFAULT true,
  joined_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_players_room ON game_players(room_id);
CREATE UNIQUE INDEX idx_game_players_room_user ON game_players(room_id, user_id);

-- 3. Game State (current state — JSONB for flexibility across game types)
CREATE TABLE IF NOT EXISTS game_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL UNIQUE REFERENCES game_rooms(id) ON DELETE CASCADE,
  state jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_state_room ON game_state(room_id);

-- 4. Game Moves (move log for replay/anti-cheat)
CREATE TABLE IF NOT EXISTS game_moves (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  action text NOT NULL,
  data jsonb DEFAULT '{}',
  move_number int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_moves_room ON game_moves(room_id);

-- 5. Game Stats (lifetime stats per user per game type)
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  game_type text NOT NULL,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  draws int DEFAULT 0,
  games_played int DEFAULT 0,
  current_streak int DEFAULT 0,
  best_streak int DEFAULT 0,
  rating int DEFAULT 1000,
  points_earned int DEFAULT 0,
  last_played_at timestamptz DEFAULT now(),
  UNIQUE(user_id, game_type)
);

CREATE INDEX idx_game_stats_user ON game_stats(user_id);
CREATE INDEX idx_game_stats_rating ON game_stats(game_type, rating DESC);

-- 6. Game Messages (in-room chat)
CREATE TABLE IF NOT EXISTS game_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  display_name text NOT NULL DEFAULT 'Player',
  text text,
  emote text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_messages_room ON game_messages(room_id, created_at);

-- 7. Game Invites (shareable invite codes)
CREATE TABLE IF NOT EXISTS game_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_by text NOT NULL,
  uses int DEFAULT 0,
  max_uses int DEFAULT 8,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_game_invites_code ON game_invites(code);

-- =============================================
-- RLS Policies (allow all via service role for API routes)
-- =============================================
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invites ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so API routes (using supabaseAdmin) work fine
-- For anon/authenticated access (if needed later):
CREATE POLICY "Allow read game rooms" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Allow read game players" ON game_players FOR SELECT USING (true);
CREATE POLICY "Allow read game stats" ON game_stats FOR SELECT USING (true);
CREATE POLICY "Allow read game messages" ON game_messages FOR SELECT USING (true);

-- Add geo JSONB column to analytics_events if not already there
-- (safe to run — ALTER TABLE IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_events' AND column_name = 'geo'
  ) THEN
    ALTER TABLE analytics_events ADD COLUMN geo jsonb;
  END IF;
END $$;
