-- Creator Platform Schema
-- Run via Supabase SQL Editor

-- 1. Creators table
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('musician', 'podcaster', 'producer', 'dj', 'content_creator')),
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  stripe_customer_id TEXT,
  stripe_connect_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
  subscription_id TEXT,
  verified BOOLEAN DEFAULT FALSE,
  track_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_slug ON creators(slug);
CREATE INDEX idx_creators_email ON creators(email);
CREATE INDEX idx_creators_category ON creators(category);
CREATE INDEX idx_creators_subscription_status ON creators(subscription_status);

-- 2. Creator tracks table
CREATE TABLE IF NOT EXISTS creator_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  producer TEXT,
  duration INTEGER, -- seconds
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  genre_tags TEXT[] DEFAULT '{}',
  plays INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_tracks_creator_id ON creator_tracks(creator_id);
CREATE INDEX idx_creator_tracks_status ON creator_tracks(status);
CREATE INDEX idx_creator_tracks_created_at ON creator_tracks(created_at DESC);

-- 3. Creator merch table
CREATE TABLE IF NOT EXISTS creator_merch (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  printify_product_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  variants JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'sold_out')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_merch_creator_id ON creator_merch(creator_id);

-- 4. Ads table
CREATE TABLE IF NOT EXISTS ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  click_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ads_active ON ads(active) WHERE active = TRUE;

-- 5. Ad impressions table
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE NOT NULL,
  user_ip_hash TEXT,
  session_id TEXT,
  played_at TIMESTAMPTZ DEFAULT now(),
  completed BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ad_impressions_ad_id ON ad_impressions(ad_id);
CREATE INDEX idx_ad_impressions_played_at ON ad_impressions(played_at DESC);

-- 6. Creator followers table
CREATE TABLE IF NOT EXISTS creator_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  follower_email TEXT NOT NULL,
  followed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, follower_email)
);

CREATE INDEX idx_creator_followers_creator_id ON creator_followers(creator_id);

-- RLS Policies
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_merch ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_followers ENABLE ROW LEVEL SECURITY;

-- Public read for active creators
CREATE POLICY "Anyone can view active creators"
  ON creators FOR SELECT
  USING (subscription_status = 'active');

-- Creators can update own record
CREATE POLICY "Creators can update own record"
  ON creators FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Public read for active tracks
CREATE POLICY "Anyone can view active tracks"
  ON creator_tracks FOR SELECT
  USING (status = 'active');

-- Creators can CRUD own tracks
CREATE POLICY "Creators can insert own tracks"
  ON creator_tracks FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can update own tracks"
  ON creator_tracks FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can delete own tracks"
  ON creator_tracks FOR DELETE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

-- Public read for active merch
CREATE POLICY "Anyone can view active merch"
  ON creator_merch FOR SELECT
  USING (status = 'active');

-- Creators can CRUD own merch
CREATE POLICY "Creators can insert own merch"
  ON creator_merch FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

CREATE POLICY "Creators can update own merch"
  ON creator_merch FOR UPDATE
  USING (creator_id IN (SELECT id FROM creators WHERE user_id = (select auth.uid())));

-- Ads: public read for active, admin write via service role
CREATE POLICY "Anyone can view active ads"
  ON ads FOR SELECT
  USING (active = TRUE AND (start_date IS NULL OR start_date <= CURRENT_DATE) AND (end_date IS NULL OR end_date >= CURRENT_DATE));

-- Ad impressions: insert only via service role (API routes)
CREATE POLICY "Service role manages ad impressions"
  ON ad_impressions FOR ALL
  USING (true);

-- Followers: anyone can follow
CREATE POLICY "Anyone can view followers"
  ON creator_followers FOR SELECT
  USING (true);

CREATE POLICY "Anyone can follow"
  ON creator_followers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can unfollow"
  ON creator_followers FOR DELETE
  USING (true);
