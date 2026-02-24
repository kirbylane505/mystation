-- KICKBACK LOUNGE — Tournament Tables
-- Run in Supabase SQL Editor

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_type TEXT NOT NULL,
  status TEXT DEFAULT 'registration', -- registration, in_progress, finished
  max_players INT DEFAULT 8,
  bracket JSONB DEFAULT '{}',
  created_by TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tournament players table
CREATE TABLE IF NOT EXISTS tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT,
  seed INT,
  eliminated BOOLEAN DEFAULT FALSE,
  wins INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tournament_players_tid ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);

-- Add tournament_id to game_rooms (for linking matches to tournaments)
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_tournament ON game_rooms(tournament_id);

-- Add role column to game_players (for spectators)
ALTER TABLE game_players ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player';

-- Enable realtime on game_rooms (for live room list updates)
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
