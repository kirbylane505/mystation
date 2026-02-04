-- MyStation Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ===========================================
-- USERS (extends Supabase auth.users)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  is_artist BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  total_plays INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- TRACKS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.tracks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Mike Page',
  album TEXT,
  producer TEXT,
  writers TEXT,
  duration INTEGER, -- seconds
  audio_url TEXT NOT NULL,
  cover_image TEXT,
  is_released BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  release_date DATE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PLAYS (Analytics)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.plays (
  id SERIAL PRIMARY KEY,
  track_id INTEGER REFERENCES public.tracks(id),
  user_id UUID REFERENCES auth.users(id),
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_listened INTEGER, -- seconds
  completed BOOLEAN DEFAULT FALSE
);

-- Index for fast play count queries
CREATE INDEX IF NOT EXISTS idx_plays_track_id ON public.plays(track_id);
CREATE INDEX IF NOT EXISTS idx_plays_user_id ON public.plays(user_id);

-- ===========================================
-- ALBUMS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.albums (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Mike Page',
  cover_image TEXT,
  release_year INTEGER,
  track_count INTEGER DEFAULT 0,
  spotify_url TEXT,
  apple_url TEXT,
  is_released BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- MERCH ORDERS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  items JSONB NOT NULL, -- [{name, size, color, price, qty}]
  total DECIMAL(10,2) NOT NULL,
  cashapp_note TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, shipped, delivered
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- VAULT (Unreleased Tracks - Private)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.vault_tracks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'Mike Page',
  producer TEXT,
  writers TEXT,
  audio_url TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'vault', -- vault, registered, released
  registered_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- EMAIL SUBSCRIBERS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ===========================================
-- LOYALTY SYSTEM - Streaks & Leaderboard
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_loyalty (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_play_date DATE,
  tier TEXT DEFAULT 'Newcomer', -- Newcomer, Supporter, Dedicated, Vault Member
  vault_unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily play log for streak tracking
CREATE TABLE IF NOT EXISTS public.daily_plays (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  play_date DATE NOT NULL,
  play_count INTEGER DEFAULT 1,
  UNIQUE(user_id, play_date)
);

-- Leaderboard view (Top 100 by streak + plays)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  ul.id,
  ul.username,
  ul.current_streak,
  ul.longest_streak,
  ul.total_plays,
  ul.tier,
  ul.vault_unlocked,
  ROW_NUMBER() OVER (ORDER BY ul.current_streak DESC, ul.total_plays DESC) as rank
FROM public.user_loyalty ul
WHERE ul.username IS NOT NULL
ORDER BY ul.current_streak DESC, ul.total_plays DESC
LIMIT 100;

-- Function to update streak on play
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
BEGIN
  -- Get user's current loyalty data
  SELECT last_play_date, current_streak INTO v_last_date, v_current_streak
  FROM public.user_loyalty WHERE id = NEW.user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_loyalty (id, current_streak, last_play_date, total_plays)
    VALUES (NEW.user_id, 1, CURRENT_DATE, 1);
    RETURN NEW;
  END IF;

  -- Update streak logic
  IF v_last_date = CURRENT_DATE THEN
    -- Already played today, just increment plays
    UPDATE public.user_loyalty
    SET total_plays = total_plays + 1, updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Played yesterday, continue streak
    UPDATE public.user_loyalty
    SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_play_date = CURRENT_DATE,
      total_plays = total_plays + 1,
      tier = CASE
        WHEN current_streak + 1 >= 90 THEN 'Vault Member'
        WHEN current_streak + 1 >= 60 THEN 'Dedicated'
        WHEN current_streak + 1 >= 30 THEN 'Supporter'
        ELSE 'Newcomer'
      END,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.user_loyalty
    SET
      current_streak = 1,
      last_play_date = CURRENT_DATE,
      total_plays = total_plays + 1,
      tier = 'Newcomer',
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;

  -- Record daily play
  INSERT INTO public.daily_plays (user_id, play_date, play_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, play_date)
  DO UPDATE SET play_count = public.daily_plays.play_count + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak on new play
CREATE OR REPLACE TRIGGER on_play_update_streak
  AFTER INSERT ON public.plays
  FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_loyalty_streak ON public.user_loyalty(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_plays ON public.user_loyalty(total_plays DESC);
CREATE INDEX IF NOT EXISTS idx_daily_plays_user ON public.daily_plays(user_id, play_date);

-- ===========================================
-- USER PLAYLISTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.playlists (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  track_ids INTEGER[] DEFAULT '{}',
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON public.playlists(user_id);

-- ===========================================
-- SONG COMMENTS
-- ===========================================
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  parent_id INTEGER REFERENCES public.comments(id), -- for replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_track ON public.comments(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public.comments(user_id);

-- Comment likes tracking
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- ===========================================
-- ARTIST PROFILES (Subscriber Artist Pages)
-- ===========================================
CREATE TABLE IF NOT EXISTS public.artist_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  artist_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly name (e.g., mike-page)
  bio TEXT,
  profile_image TEXT,
  cover_image TEXT,
  location TEXT,
  genres TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}', -- {instagram, twitter, spotify, etc}
  streaming_links JSONB DEFAULT '{}', -- {spotify, apple, soundcloud}
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  follower_count INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free', -- free, pro, premium
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_slug ON public.artist_profiles(slug);

-- Artist tracks (for artists who upload their own music)
CREATE TABLE IF NOT EXISTS public.artist_tracks (
  id SERIAL PRIMARY KEY,
  artist_id UUID REFERENCES public.artist_profiles(id),
  title TEXT NOT NULL,
  album TEXT,
  producer TEXT,
  featured TEXT, -- featured artists
  duration INTEGER, -- seconds
  audio_url TEXT NOT NULL,
  cover_image TEXT,
  bpm INTEGER,
  key TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_tracks ON public.artist_tracks(artist_id);

-- Artist followers
CREATE TABLE IF NOT EXISTS public.artist_followers (
  id SERIAL PRIMARY KEY,
  artist_id UUID REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artist_id, follower_id)
);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tracks: Everyone can read released tracks
CREATE POLICY "Released tracks are viewable by everyone" ON public.tracks FOR SELECT USING (is_released = true);

-- Plays: Users can insert own plays, read own plays
CREATE POLICY "Users can log plays" ON public.plays FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own plays" ON public.plays FOR SELECT USING (auth.uid() = user_id);

-- Albums: Everyone can read
CREATE POLICY "Albums are viewable by everyone" ON public.albums FOR SELECT USING (true);

-- Orders: Users can read own orders
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);

-- Vault: Only admin (will check in app code)
CREATE POLICY "Vault is private" ON public.vault_tracks FOR SELECT USING (false);

-- Subscribers: Insert only
CREATE POLICY "Anyone can subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);

-- Enable RLS for loyalty tables
ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plays ENABLE ROW LEVEL SECURITY;

-- Loyalty: Everyone can read leaderboard, users update own
CREATE POLICY "Loyalty stats are public" ON public.user_loyalty FOR SELECT USING (true);
CREATE POLICY "Users can update own loyalty" ON public.user_loyalty FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert loyalty" ON public.user_loyalty FOR INSERT WITH CHECK (true);

-- Daily plays: Users can read own
CREATE POLICY "Users can read own daily plays" ON public.daily_plays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert daily plays" ON public.daily_plays FOR INSERT WITH CHECK (true);

-- Enable RLS for playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public playlists viewable by all" ON public.playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by all" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like comments" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike comments" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS for artist profiles
ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artist profiles viewable by all" ON public.artist_profiles FOR SELECT USING (true);
CREATE POLICY "Artists can update own profile" ON public.artist_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create artist profile" ON public.artist_profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.artist_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public artist tracks viewable" ON public.artist_tracks FOR SELECT USING (is_public = true);
CREATE POLICY "Artists can manage own tracks" ON public.artist_tracks FOR ALL USING (auth.uid() = artist_id);

ALTER TABLE public.artist_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Followers viewable by all" ON public.artist_followers FOR SELECT USING (true);
CREATE POLICY "Users can follow artists" ON public.artist_followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow artists" ON public.artist_followers FOR DELETE USING (auth.uid() = follower_id);

-- ===========================================
-- ADMIN ACCESS (for Mike)
-- Set your user ID as admin after first signup
-- ===========================================
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';
