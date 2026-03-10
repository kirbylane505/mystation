# MyStation Member Profiles — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add social member profiles to MyStation — avatar, display name, bio, game stats, badges, follow system, curated playlists, and public profile pages at `/station/[username]`.

**Architecture:** Builds on existing `sub_[hash(email)]` identity system. New `profiles` table keyed by user_id, new Zustand `useProfileStore`. Existing tables (comments, fan_wall, game_stats) remain untouched — profile data is pulled at render time. Public profiles served at `/station/[username]`, coexisting with creator stations (profile check first, creator station fallback).

**Tech Stack:** Next.js 14, Supabase (Postgres + Storage + RLS), Zustand, Tailwind CSS

---

## Tier System

| Tier | Who | Features |
|------|-----|----------|
| Free (Listener) | Anyone with account | Avatar, display name, bio, game stats, badges, public profile |
| Subscriber ($4.99/mo) | Active subscribers | All free + banner color, featured playlist, "Now Playing" display, subscriber badge glow, playlist creation (up to 10) |
| Diamond ($14.99/mo) | Top tier | All subscriber + animated avatar border, diamond badge, priority in leaderboards |

---

## Data Architecture

### New Supabase Tables

**profiles**
```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,        -- sub_[hash] from playerId.js
  email TEXT,                           -- for lookup
  username TEXT UNIQUE NOT NULL,        -- lowercase, 3-20 chars, alphanumeric + underscores
  display_name TEXT DEFAULT 'Music Fan', -- max 24 chars
  bio TEXT DEFAULT '',                  -- max 160 chars
  avatar_url TEXT DEFAULT '',           -- Supabase storage URL or empty for auto-generated
  avatar_style TEXT DEFAULT 'initials', -- auto-gen style: initials, geometric, gradient, rings, etc.
  banner_color TEXT DEFAULT '#1e293b', -- subscriber feature
  featured_playlist_id UUID,           -- subscriber feature
  show_now_playing BOOLEAN DEFAULT false, -- subscriber feature
  tier TEXT DEFAULT 'free',            -- free, subscriber, diamond
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**follows**
```sql
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id TEXT NOT NULL,           -- sub_[hash] of follower
  following_id TEXT NOT NULL,          -- sub_[hash] of followed user
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
```

**playlists**
```sql
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,                  -- max 40 chars
  description TEXT DEFAULT '',         -- max 120 chars
  track_ids JSONB DEFAULT '[]',        -- ordered array of track IDs, max 50
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**activity_feed**
```sql
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,                  -- badge_earned, game_win, streak, playlist_created, milestone
  data JSONB DEFAULT '{}',            -- badge_id, game_type, streak_count, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**badges**
```sql
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,              -- e.g. 'first_win', 'streak_5', 'early_bird'
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
```

### Storage

- Supabase Storage bucket: `avatars`
- Path: `avatars/{user_id}/avatar.{ext}`
- Max size: 2MB, image/* only
- RLS: owner can upload/update, public read

### Indexes

```sql
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_playlists_user ON playlists(user_id);
CREATE INDEX idx_activity_user ON activity_feed(user_id);
CREATE INDEX idx_badges_user ON badges(user_id);
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/profile` | GET | Get own profile |
| `/api/profile` | PUT | Update own profile |
| `/api/profile/[username]` | GET | Get public profile by username |
| `/api/profile/check-username` | GET | Check username availability |
| `/api/profile/follow` | POST | Toggle follow/unfollow |
| `/api/profile/followers/[userId]` | GET | Get follower/following counts + list |
| `/api/profile/playlists` | GET/POST | List own playlists / create playlist |
| `/api/profile/playlists/[id]` | GET/PUT/DELETE | Playlist CRUD |
| `/api/profile/badges/[userId]` | GET | Get user's badges |
| `/api/profile/activity/[userId]` | GET | Get activity feed (paginated) |

---

## Profile Page Design (`/station/[username]`)

### Header
- Avatar (80px, circular, tier-colored border ring)
- Display name + @username
- Tier badge (Listener / Subscriber / Diamond)
- Bio text
- Follow button + follower/following counts
- Banner color strip (subscribers only)

### Tabs (4)
1. **Highlights** — Activity feed: badges earned, game wins, streaks, milestones
2. **Playlists** — Curated playlists (subscribers) or empty state for free users
3. **Stats** — Game stats from existing `game_stats` table (wins, losses, streaks per game)
4. **Badges** — Visual badge grid with earned/locked states

### 12 Initial Badges
| Badge | ID | Criteria |
|-------|----|----------|
| First Listen | `first_listen` | Play any track |
| Subscriber | `subscriber` | Active subscription |
| Diamond | `diamond` | Diamond tier |
| First Win | `first_win` | Win any game |
| Hot Streak | `streak_5` | 5-game win streak |
| Domino King | `domino_master` | 10 dominoes wins |
| Card Shark | `card_shark` | 10 blackjack wins |
| Spades Ace | `spades_ace` | 10 spades wins |
| Pool Hustler | `pool_hustler` | 10 pool wins |
| Quiz Brain | `quiz_brain` | Perfect quiz score |
| Early Bird | `early_bird` | Joined before LOTL 2026 |
| Social Butterfly | `social_50` | 50+ followers |

---

## Edit Profile UI

- Located at `/account/profile` (or modal from profile page)
- Fields: display name (24 chars), username (3-20, lowercase alphanumeric + underscores, unique check on blur), bio (160 chars), avatar (upload or 8 auto-generated styles)
- Subscriber extras: banner color picker, featured playlist selector, "Now Playing" toggle
- Username uniqueness via `/api/profile/check-username` (debounced 500ms)
- Simple profanity blocklist on display name and bio
- Single `PUT /api/profile` to save

---

## Follow System

- One-way follows (no approval needed)
- `POST /api/profile/follow` toggles follow/unfollow
- Follower + following counts on profile header
- Rate limit: max 50 follows per hour
- No activity feed of followed users in v1 — just counts and lists

---

## Curated Playlists (Subscribers Only)

- Max 10 playlists, max 50 tracks each
- Playlist = name (40 chars) + description (120 chars) + ordered track IDs
- Public by default, toggle to private
- Displayed on profile Playlists tab
- Clicking playlist loads tracks into player queue

---

## Integration Points

- **Comments:** New comments pull `avatar_url` and `display_name` from `profiles` table. Existing comments unchanged.
- **Fan Wall:** Same — new posts use profile data. Old posts unchanged.
- **Lounge/Games:** `game_stats` already keyed by `user_id`. Profile Stats tab queries by user_id. No game code changes.
- **Leaderboards:** Profile avatars display on leaderboards. Username links to `/station/[username]`.
- **Creator Stations:** `/station/[username]` checks `profiles` first. No profile found = fallback to localStorage creator station.

---

## What This Does NOT Touch

- Existing `subscribers` table schema (no columns added)
- Existing `comments` table schema
- Existing `fan_wall` table schema
- Existing `game_stats` / `game_rooms` / `game_players` tables
- Existing authentication flow
- Existing subscription/payment flow
- Audio player or music gate logic
