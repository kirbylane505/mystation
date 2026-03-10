# Member Profiles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add social member profiles to MyStation — avatar, display name, bio, game stats, badges, follow system, curated playlists, and public profile pages at `/station/[username]`.

**Architecture:** New `profiles` table keyed by `user_id` (`sub_[hash(email)]` from `src/lib/playerId.js`). New Zustand `useProfileStore`. Existing tables (comments, fan_wall, game_stats) stay untouched — profile data pulled at render time. `/station/[username]` checks profiles first, falls back to existing creator station logic.

**Tech Stack:** Next.js 15, Supabase (Postgres + Storage), Zustand, Tailwind CSS

**Design doc:** `docs/plans/2026-03-06-member-profiles-design.md`

---

## Task 1: Create Supabase Tables

**Files:**
- Create: `src/lib/db/profile-schema.sql` (reference file, executed via supabase-sql.sh)

**Step 1: Create the SQL schema file**

```sql
-- MEMBER PROFILES SCHEMA
-- Run via: /MikePageEmpire/tools/supabase-sql.sh

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT 'Music Fan',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  avatar_style TEXT DEFAULT 'initials',
  banner_color TEXT DEFAULT '#1e293b',
  featured_playlist_id UUID,
  show_now_playing BOOLEAN DEFAULT false,
  tier TEXT DEFAULT 'free',
  joined_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  track_ids JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);

-- Avatars storage bucket (run manually in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
```

**Step 2: Run the SQL via supabase-sql.sh**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
cat src/lib/db/profile-schema.sql | /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh
```

Expected: Tables created, no errors.

**Step 3: Create avatars storage bucket**

Run in Supabase dashboard SQL editor or via supabase-sql.sh:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] != '');

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Avatar owner update" ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');
```

**Step 4: Commit**

```bash
git add "src/lib/db/profile-schema.sql"
git commit -m "feat: add member profiles database schema (5 tables + storage bucket)"
```

---

## Task 2: Profile Constants & Badge Definitions

**Files:**
- Create: `src/lib/profiles/badges.js`
- Create: `src/lib/profiles/constants.js`

**Step 1: Create badge definitions**

Create `src/lib/profiles/badges.js`:
```javascript
/**
 * MYSTATION — Badge Definitions
 * 12 initial badges with criteria
 */

export const BADGE_DEFINITIONS = {
  first_listen: {
    id: 'first_listen',
    name: 'First Listen',
    description: 'Played your first track',
    icon: '🎵',
    color: '#3b82f6',
  },
  subscriber: {
    id: 'subscriber',
    name: 'Subscriber',
    description: 'Active MyStation subscriber',
    icon: '⭐',
    color: '#8b5cf6',
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    description: 'Diamond tier member',
    icon: '💎',
    color: '#f59e0b',
  },
  first_win: {
    id: 'first_win',
    name: 'First Win',
    description: 'Won your first game',
    icon: '🏆',
    color: '#10b981',
  },
  streak_5: {
    id: 'streak_5',
    name: 'Hot Streak',
    description: '5-game win streak',
    icon: '🔥',
    color: '#ef4444',
  },
  domino_master: {
    id: 'domino_master',
    name: 'Domino King',
    description: '10 dominoes wins',
    icon: '🁡',
    color: '#d97706',
  },
  card_shark: {
    id: 'card_shark',
    name: 'Card Shark',
    description: '10 blackjack wins',
    icon: '🃏',
    color: '#10b981',
  },
  spades_ace: {
    id: 'spades_ace',
    name: 'Spades Ace',
    description: '10 spades wins',
    icon: '♠️',
    color: '#3b82f6',
  },
  pool_hustler: {
    id: 'pool_hustler',
    name: 'Pool Hustler',
    description: '10 pool wins',
    icon: '🎱',
    color: '#6366f1',
  },
  quiz_brain: {
    id: 'quiz_brain',
    name: 'Quiz Brain',
    description: 'Perfect quiz score',
    icon: '🧠',
    color: '#eab308',
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Joined before LOTL 2026',
    icon: '🐦',
    color: '#06b6d4',
  },
  social_50: {
    id: 'social_50',
    name: 'Social Butterfly',
    description: '50+ followers',
    icon: '🦋',
    color: '#ec4899',
  },
};
```

**Step 2: Create profile constants**

Create `src/lib/profiles/constants.js`:
```javascript
/**
 * MYSTATION — Profile Constants
 */

export const AVATAR_STYLES = [
  'initials',
  'geometric',
  'gradient',
  'rings',
  'dots',
  'waves',
  'blocks',
  'diamond',
];

export const TIER_BADGES = {
  free: { label: 'Listener', color: '#64748b', border: 'border-slate-500' },
  subscriber: { label: 'Subscriber', color: '#8b5cf6', border: 'border-purple-500' },
  diamond: { label: 'Diamond', color: '#f59e0b', border: 'border-amber-500' },
};

export const PROFILE_LIMITS = {
  displayNameMax: 24,
  usernameMin: 3,
  usernameMax: 20,
  bioMax: 160,
  playlistNameMax: 40,
  playlistDescMax: 120,
  maxPlaylists: 10,
  maxTracksPerPlaylist: 50,
  maxFollowsPerHour: 50,
  avatarMaxSize: 2 * 1024 * 1024, // 2MB
};

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// Simple profanity blocklist
export const BLOCKED_WORDS = [
  // Add as needed — keeping minimal
];
```

**Step 3: Commit**

```bash
git add "src/lib/profiles/badges.js" "src/lib/profiles/constants.js"
git commit -m "feat: add badge definitions and profile constants"
```

---

## Task 3: Profile API — Core CRUD

**Files:**
- Create: `src/app/api/profile/route.js`
- Create: `src/app/api/profile/check-username/route.js`

**Step 1: Create main profile API**

Create `src/app/api/profile/route.js`:
```javascript
/**
 * MYSTATION — Profile API
 * GET: Get own profile (by email cookie/header)
 * PUT: Update own profile
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PROFILE_LIMITS, USERNAME_REGEX } from '@/lib/profiles/constants';

function getEmailFromRequest(request) {
  const emailCookie = request.cookies.get('mystation-email');
  if (emailCookie?.value) return emailCookie.value;
  const headerEmail = request.headers.get('x-user-email');
  if (headerEmail) return headerEmail;
  return null;
}

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function GET(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const userId = await hashEmail(email);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    // Get follower/following counts
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);

    return NextResponse.json({
      profile: { ...profile, followers: followers || 0, following: following || 0 },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const userId = await hashEmail(email);
    const body = await request.json();

    // Validate fields
    const updates = {};

    if (body.username !== undefined) {
      const username = body.username.toLowerCase().trim();
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json({ error: 'Username must be 3-20 chars, lowercase alphanumeric + underscores' }, { status: 400 });
      }
      // Check uniqueness
      const { data: existing } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .neq('user_id', userId)
        .single();
      if (existing) {
        return NextResponse.json({ error: 'Username taken' }, { status: 409 });
      }
      updates.username = username;
    }

    if (body.display_name !== undefined) {
      updates.display_name = body.display_name.trim().slice(0, PROFILE_LIMITS.displayNameMax);
    }

    if (body.bio !== undefined) {
      updates.bio = body.bio.trim().slice(0, PROFILE_LIMITS.bioMax);
    }

    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.avatar_style !== undefined) updates.avatar_style = body.avatar_style;
    if (body.banner_color !== undefined) updates.banner_color = body.banner_color;
    if (body.show_now_playing !== undefined) updates.show_now_playing = !!body.show_now_playing;
    if (body.featured_playlist_id !== undefined) updates.featured_playlist_id = body.featured_playlist_id;

    updates.updated_at = new Date().toISOString();

    // Upsert — create if not exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email,
        ...updates,
        // Defaults for new profiles
        ...(body._isNew ? { username: updates.username || email.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20) } : {}),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
```

**Step 2: Create username check API**

Create `src/app/api/profile/check-username/route.js`:
```javascript
/**
 * MYSTATION — Check Username Availability
 * GET: ?username=desired_name
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { USERNAME_REGEX } from '@/lib/profiles/constants';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json({ available: false, error: 'Invalid username format' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ available: false, error: 'Database not configured' });
    }

    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username)
      .single();

    return NextResponse.json({ available: !data, username });
  } catch (err) {
    return NextResponse.json({ available: false, error: 'Check failed' });
  }
}
```

**Step 3: Commit**

```bash
git add "src/app/api/profile/route.js" "src/app/api/profile/check-username/route.js"
git commit -m "feat: add profile CRUD and username check APIs"
```

---

## Task 4: Public Profile API

**Files:**
- Create: `src/app/api/profile/[username]/route.js`

**Step 1: Create public profile endpoint**

Create `src/app/api/profile/[username]/route.js`:
```javascript
/**
 * MYSTATION — Public Profile API
 * GET: Get public profile by username (with stats, badges, counts)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request, { params }) {
  try {
    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    // Get counts, badges, game stats, activity in parallel
    const [
      { count: followers },
      { count: following },
      { data: badges },
      { data: gameStats },
      { data: activity },
      { data: publicPlaylists },
    ] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.user_id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.user_id),
      supabase.from('badges').select('badge_id, earned_at').eq('user_id', profile.user_id),
      supabase.from('game_stats').select('game_type, wins, losses, games_played, current_streak, best_streak, points_earned').eq('user_id', profile.user_id),
      supabase.from('activity_feed').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(20),
      supabase.from('playlists').select('id, name, description, track_ids, created_at').eq('user_id', profile.user_id).eq('is_public', true).order('created_at', { ascending: false }),
    ]);

    // Check if requester follows this user
    let isFollowing = false;
    const reqEmail = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (reqEmail) {
      const encoder = new TextEncoder();
      const data = encoder.encode(reqEmail.toLowerCase().trim());
      const hash = await crypto.subtle.digest('SHA-256', data);
      const arr = Array.from(new Uint8Array(hash));
      const requesterId = 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

      const { data: followRow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', requesterId)
        .eq('following_id', profile.user_id)
        .single();
      isFollowing = !!followRow;
    }

    // Strip email from public response
    const { email: _email, ...publicProfile } = profile;

    return NextResponse.json({
      profile: {
        ...publicProfile,
        followers: followers || 0,
        following: following || 0,
        isFollowing,
        badges: badges || [],
        gameStats: gameStats || [],
        activity: activity || [],
        playlists: (publicPlaylists || []).map(p => ({
          ...p,
          trackCount: Array.isArray(p.track_ids) ? p.track_ids.length : 0,
        })),
      },
    });
  } catch (err) {
    console.error('Public profile error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/profile/[username]/route.js"
git commit -m "feat: add public profile API with stats, badges, activity"
```

---

## Task 5: Follow API

**Files:**
- Create: `src/app/api/profile/follow/route.js`

**Step 1: Create follow toggle endpoint**

Create `src/app/api/profile/follow/route.js`:
```javascript
/**
 * MYSTATION — Follow API
 * POST: Toggle follow/unfollow a user
 * Body: { targetUserId }
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

// Simple rate limiter
const followLimits = new Map();
const MAX_FOLLOWS_PER_HOUR = 50;

export async function POST(request) {
  try {
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
    }

    const followerId = await hashEmail(email);

    if (followerId === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Rate limit
    const now = Date.now();
    const record = followLimits.get(followerId);
    if (record && now - record.firstAt < 3600000 && record.count >= MAX_FOLLOWS_PER_HOUR) {
      return NextResponse.json({ error: 'Follow rate limit exceeded' }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', targetUserId)
      .single();

    if (existing) {
      // Unfollow
      await supabase.from('follows').delete().eq('id', existing.id);
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: followerId, following_id: targetUserId });

      // Update rate limit
      if (!record || now - record.firstAt >= 3600000) {
        followLimits.set(followerId, { count: 1, firstAt: now });
      } else {
        record.count++;
      }

      return NextResponse.json({ following: true });
    }
  } catch (err) {
    console.error('Follow error:', err);
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/profile/follow/route.js"
git commit -m "feat: add follow/unfollow toggle API with rate limiting"
```

---

## Task 6: Playlists API

**Files:**
- Create: `src/app/api/profile/playlists/route.js`
- Create: `src/app/api/profile/playlists/[id]/route.js`

**Step 1: Create playlists list/create endpoint**

Create `src/app/api/profile/playlists/route.js`:
```javascript
/**
 * MYSTATION — Playlists API
 * GET: List own playlists
 * POST: Create a playlist (subscribers only)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PROFILE_LIMITS } from '@/lib/profiles/constants';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

function getEmailFromRequest(request) {
  return request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email') || null;
}

export async function GET(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) return NextResponse.json({ playlists: [] });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ playlists: [] });

    const userId = await hashEmail(email);
    const { data } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ playlists: data || [] });
  } catch (err) {
    return NextResponse.json({ playlists: [], error: 'Failed to fetch' });
  }
}

export async function POST(request) {
  try {
    const email = getEmailFromRequest(request);
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Check subscriber status
    const isSub = request.cookies.get('mystation-sub')?.value ||
                  request.cookies.get('mystation-sub-flag')?.value;
    if (!isSub) {
      return NextResponse.json({ error: 'Subscribers only' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);
    const body = await request.json();

    // Check playlist count limit
    const { count } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count || 0) >= PROFILE_LIMITS.maxPlaylists) {
      return NextResponse.json({ error: `Max ${PROFILE_LIMITS.maxPlaylists} playlists` }, { status: 400 });
    }

    const name = (body.name || 'My Playlist').trim().slice(0, PROFILE_LIMITS.playlistNameMax);
    const description = (body.description || '').trim().slice(0, PROFILE_LIMITS.playlistDescMax);
    const trackIds = Array.isArray(body.track_ids)
      ? body.track_ids.slice(0, PROFILE_LIMITS.maxTracksPerPlaylist)
      : [];

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name,
        description,
        track_ids: trackIds,
        is_public: body.is_public !== false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ playlist });
  } catch (err) {
    console.error('Playlist create error:', err);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
```

**Step 2: Create individual playlist endpoint**

Create `src/app/api/profile/playlists/[id]/route.js`:
```javascript
/**
 * MYSTATION — Single Playlist API
 * GET: Get playlist by ID (public playlists visible to all)
 * PUT: Update playlist (owner only)
 * DELETE: Delete playlist (owner only)
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { PROFILE_LIMITS } from '@/lib/profiles/constants';

async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const { data: playlist } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', id)
      .single();

    if (!playlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Private playlists only visible to owner
    if (!playlist.is_public) {
      const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
      if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const userId = await hashEmail(email);
      if (userId !== playlist.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);

    // Verify ownership
    const { data: existing } = await supabase.from('playlists').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name.trim().slice(0, PROFILE_LIMITS.playlistNameMax);
    if (body.description !== undefined) updates.description = body.description.trim().slice(0, PROFILE_LIMITS.playlistDescMax);
    if (body.track_ids !== undefined) updates.track_ids = Array.isArray(body.track_ids) ? body.track_ids.slice(0, PROFILE_LIMITS.maxTracksPerPlaylist) : [];
    if (body.is_public !== undefined) updates.is_public = !!body.is_public;

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ playlist });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const email = request.cookies.get('mystation-email')?.value || request.headers.get('x-user-email');
    if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

    const userId = await hashEmail(email);
    const { data: existing } = await supabase.from('playlists').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await supabase.from('playlists').delete().eq('id', id);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add "src/app/api/profile/playlists/route.js" "src/app/api/profile/playlists/[id]/route.js"
git commit -m "feat: add playlist CRUD APIs (subscribers only, max 10)"
```

---

## Task 7: Profile Store (Zustand)

**Files:**
- Create: `src/store/profileStore.js`

**Step 1: Create the store**

Create `src/store/profileStore.js`:
```javascript
/**
 * MYSTATION — Profile State Management
 * Manages current user's profile, loading, and mutations
 */

import { create } from 'zustand';

export const useProfileStore = create((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  // Fetch own profile
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      set({ profile: data.profile, loading: false });
      return data.profile;
    } catch (err) {
      set({ error: 'Failed to load profile', loading: false });
      return null;
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.profile) {
        set({ profile: data.profile });
        return { success: true, profile: data.profile };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'Network error' };
    }
  },

  // Check username availability
  checkUsername: async (username) => {
    try {
      const res = await fetch(`/api/profile/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      return data.available;
    } catch {
      return false;
    }
  },

  // Toggle follow
  toggleFollow: async (targetUserId) => {
    try {
      const res = await fetch('/api/profile/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { error: 'Network error' };
    }
  },

  // Clear profile (on logout)
  clearProfile: () => set({ profile: null, loading: false, error: null }),
}));
```

**Step 2: Commit**

```bash
git add "src/store/profileStore.js"
git commit -m "feat: add useProfileStore for profile state management"
```

---

## Task 8: Auto-Generated Avatar Component

**Files:**
- Create: `src/components/profile/AutoAvatar.jsx`

**Step 1: Create the component**

Create `src/components/profile/AutoAvatar.jsx`:
```jsx
/**
 * MYSTATION — Auto-Generated Avatar
 * Generates unique avatars from user_id + display_name
 * Styles: initials, geometric, gradient, rings, dots, waves, blocks, diamond
 */

'use client';

const PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColors(seed) {
  const h = hashCode(seed);
  return [PALETTE[h % PALETTE.length], PALETTE[(h * 7) % PALETTE.length]];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function AutoAvatar({
  userId = '',
  displayName = '',
  avatarUrl = '',
  style = 'initials',
  size = 80,
  tierBorder = '',
  className = '',
}) {
  // If custom avatar uploaded, use it
  if (avatarUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden shrink-0 ${tierBorder} ${className}`}
        style={{ width: size, height: size, borderWidth: tierBorder ? 3 : 0 }}
      >
        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
      </div>
    );
  }

  const seed = userId || displayName || 'default';
  const [c1, c2] = getColors(seed);
  const initials = getInitials(displayName);

  const svgContent = (() => {
    switch (style) {
      case 'geometric': {
        const h = hashCode(seed);
        const shapes = [];
        for (let i = 0; i < 4; i++) {
          const x = (h * (i + 1) * 13) % 80;
          const y = (h * (i + 1) * 17) % 80;
          const r = 10 + ((h * (i + 1)) % 20);
          shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 === 0 ? c1 : c2}" opacity="0.7"/>`);
        }
        return `<rect width="80" height="80" fill="${c1}" opacity="0.3"/>${shapes.join('')}`;
      }
      case 'gradient':
        return `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="80" height="80" fill="url(#g)"/>`;
      case 'rings': {
        const h = hashCode(seed);
        return `<rect width="80" height="80" fill="#1e293b"/><circle cx="40" cy="40" r="35" fill="none" stroke="${c1}" stroke-width="3"/><circle cx="40" cy="40" r="25" fill="none" stroke="${c2}" stroke-width="3"/><circle cx="40" cy="40" r="15" fill="${c1}" opacity="0.5"/>`;
      }
      case 'dots': {
        const h = hashCode(seed);
        const dots = [];
        for (let i = 0; i < 9; i++) {
          const x = 15 + (i % 3) * 25;
          const y = 15 + Math.floor(i / 3) * 25;
          const on = (h >> i) & 1;
          dots.push(`<circle cx="${x}" cy="${y}" r="8" fill="${on ? c1 : c2}" opacity="${on ? 0.9 : 0.3}"/>`);
        }
        return `<rect width="80" height="80" fill="#1e293b"/>${dots.join('')}`;
      }
      case 'waves':
        return `<rect width="80" height="80" fill="${c1}" opacity="0.3"/><path d="M0,40 Q20,20 40,40 Q60,60 80,40" stroke="${c1}" stroke-width="4" fill="none"/><path d="M0,55 Q20,35 40,55 Q60,75 80,55" stroke="${c2}" stroke-width="3" fill="none"/>`;
      case 'blocks': {
        const h = hashCode(seed);
        const blocks = [];
        for (let i = 0; i < 16; i++) {
          const x = (i % 4) * 20;
          const y = Math.floor(i / 4) * 20;
          const on = (h >> i) & 1;
          blocks.push(`<rect x="${x}" y="${y}" width="20" height="20" fill="${on ? c1 : c2}" opacity="${on ? 0.8 : 0.2}"/>`);
        }
        return blocks.join('');
      }
      case 'diamond':
        return `<rect width="80" height="80" fill="#1e293b"/><polygon points="40,5 75,40 40,75 5,40" fill="${c1}" opacity="0.7"/><polygon points="40,15 65,40 40,65 15,40" fill="${c2}" opacity="0.5"/>`;
      default: // initials
        return `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="80" height="80" rx="40" fill="url(#g)"/><text x="40" y="40" text-anchor="middle" dominant-baseline="central" font-family="system-ui" font-weight="700" font-size="28" fill="white">${initials}</text>`;
    }
  })();

  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${svgContent}</svg>`)}`;

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${tierBorder} ${className}`}
      style={{ width: size, height: size, borderWidth: tierBorder ? 3 : 0 }}
    >
      <img src={svgDataUrl} alt={displayName} className="w-full h-full" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "src/components/profile/AutoAvatar.jsx"
git commit -m "feat: add auto-generated avatar component (8 styles)"
```

---

## Task 9: Profile Page Component

**Files:**
- Modify: `src/app/station/[username]/page.jsx` (complete rewrite)

**Step 1: Rewrite the station page to check profiles first**

Read the existing file, then rewrite `src/app/station/[username]/page.jsx`:

```jsx
/**
 * MYSTATION — Station/Profile Page
 * Checks profiles table first, falls back to creator station
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStationStore } from '@/store/stationStore';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { useProfileStore } from '@/store/profileStore';
import AutoAvatar from '@/components/profile/AutoAvatar';
import { BADGE_DEFINITIONS } from '@/lib/profiles/badges';
import { TIER_BADGES } from '@/lib/profiles/constants';
import {
  Music, ListMusic, Heart, Share2, Trophy, Award, Flame, Users,
  Play, Star, Lock, BarChart3
} from 'lucide-react';
import Link from 'next/link';

// Fallback: existing creator station page
import CreatorStationContent from './CreatorStationContent';

export default function StationPage() {
  const params = useParams();
  const { username } = params;
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreatorStation, setIsCreatorStation] = useState(false);
  const [activeTab, setActiveTab] = useState('highlights');

  const { email } = useUserStore();
  const { toggleFollow } = useProfileStore();
  const { setQueue } = usePlayerStore();

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.profile) {
        setProfileData(data.profile);
        setIsCreatorStation(false);
      } else {
        // No member profile — fall back to creator station
        setIsCreatorStation(true);
      }
    } catch {
      setIsCreatorStation(true);
    }
    setLoading(false);
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Fall back to existing creator station
  if (isCreatorStation) {
    return <CreatorStationContent username={username} />;
  }

  const profile = profileData;
  const tierConfig = TIER_BADGES[profile.tier] || TIER_BADGES.free;

  async function handleFollow() {
    const result = await toggleFollow(profile.user_id);
    if (result.following !== undefined) {
      setProfileData(prev => ({
        ...prev,
        isFollowing: result.following,
        followers: prev.followers + (result.following ? 1 : -1),
      }));
    }
  }

  const tabs = [
    { id: 'highlights', name: 'Highlights', icon: Flame },
    { id: 'playlists', name: 'Playlists', icon: ListMusic },
    { id: 'stats', name: 'Stats', icon: BarChart3 },
    { id: 'badges', name: 'Badges', icon: Award },
  ];

  const earnedBadgeIds = new Set((profile.badges || []).map(b => b.badge_id));

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="relative">
        <div
          className="h-32 sm:h-40"
          style={{ background: `linear-gradient(135deg, ${tierConfig.color}40, ${tierConfig.color}10)` }}
        />

        <div className="max-w-2xl mx-auto px-4 -mt-16">
          <div className="flex flex-col items-center text-center">
            <AutoAvatar
              userId={profile.user_id}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              style={profile.avatar_style}
              size={96}
              tierBorder={tierConfig.border}
            />

            <h1 className="text-2xl font-bold text-white mt-3">{profile.display_name}</h1>
            <p className="text-white/50 text-sm">@{profile.username}</p>

            <span
              className="mt-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: tierConfig.color + '20', color: tierConfig.color }}
            >
              {tierConfig.label}
            </span>

            {profile.bio && (
              <p className="text-white/70 text-sm mt-3 max-w-md">{profile.bio}</p>
            )}

            {/* Counts + Follow */}
            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-white font-bold">{profile.followers || 0}</p>
                <p className="text-white/40 text-xs">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold">{profile.following || 0}</p>
                <p className="text-white/40 text-xs">Following</p>
              </div>

              {email && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
                    profile.isFollowing
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="flex gap-1 border-b border-white/10 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-white border-blue-500'
                  : 'text-white/40 border-transparent hover:text-white/60'
              }`}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Highlights Tab */}
        {activeTab === 'highlights' && (
          <div className="space-y-3">
            {(profile.activity || []).length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Flame size={32} className="mx-auto mb-2 opacity-50" />
                <p>No highlights yet</p>
              </div>
            ) : (
              profile.activity.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-xl">
                  <span className="text-xl">
                    {item.type === 'badge_earned' ? (BADGE_DEFINITIONS[item.data?.badge_id]?.icon || '🏅') :
                     item.type === 'game_win' ? '🏆' :
                     item.type === 'streak' ? '🔥' :
                     item.type === 'playlist_created' ? '🎵' : '⭐'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm">
                      {item.type === 'badge_earned' ? `Earned "${BADGE_DEFINITIONS[item.data?.badge_id]?.name || 'Badge'}"` :
                       item.type === 'game_win' ? `Won a game of ${item.data?.game_type || 'unknown'}` :
                       item.type === 'streak' ? `${item.data?.streak_count}-game win streak!` :
                       item.type === 'playlist_created' ? `Created playlist "${item.data?.name || ''}"` :
                       item.data?.message || 'Activity'}
                    </p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="space-y-3">
            {(profile.playlists || []).length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <ListMusic size={32} className="mx-auto mb-2 opacity-50" />
                <p>{profile.tier === 'free' ? 'Playlists are a subscriber feature' : 'No playlists yet'}</p>
                {profile.tier === 'free' && (
                  <Link href="/subscribe" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                    Subscribe to create playlists
                  </Link>
                )}
              </div>
            ) : (
              profile.playlists.map(playlist => (
                <div key={playlist.id} className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center shrink-0">
                    <Music size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{playlist.name}</p>
                    <p className="text-white/40 text-xs">{playlist.trackCount || 0} tracks</p>
                  </div>
                  <button className="p-2 bg-blue-500/20 rounded-full text-blue-400 opacity-0 group-hover:opacity-100 transition">
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-3">
            {(profile.gameStats || []).length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Trophy size={32} className="mx-auto mb-2 opacity-50" />
                <p>No game stats yet — hit the Lounge!</p>
                <Link href="/lounge" className="text-blue-400 text-sm mt-2 inline-block hover:underline">
                  Play a game
                </Link>
              </div>
            ) : (
              profile.gameStats.map(stat => (
                <div key={stat.game_type} className="p-4 bg-white/[0.03] rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium capitalize">{stat.game_type}</p>
                    <span className="text-white/40 text-xs">{stat.games_played} games</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-green-400 font-bold">{stat.wins}</span>
                      <span className="text-white/30 ml-1">W</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-bold">{stat.losses}</span>
                      <span className="text-white/30 ml-1">L</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold">{stat.best_streak}</span>
                      <span className="text-white/30 ml-1">Best Streak</span>
                    </div>
                    <div>
                      <span className="text-blue-400 font-bold">{stat.points_earned}</span>
                      <span className="text-white/30 ml-1">pts</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Object.values(BADGE_DEFINITIONS).map(badge => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-3 rounded-xl text-center transition ${
                    earned ? 'bg-white/[0.05]' : 'bg-white/[0.02] opacity-40'
                  }`}
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <p className="text-white text-xs font-medium">{badge.name}</p>
                  <p className="text-white/30 text-[10px] mt-0.5">{badge.description}</p>
                  {!earned && <Lock size={10} className="text-white/20 mt-1" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Extract existing creator station into its own component**

Create `src/app/station/[username]/CreatorStationContent.jsx` — move the ENTIRE existing content of `page.jsx` (the current code with products, tips, etc.) into this file, changing `export default function StationPage()` to `export default function CreatorStationContent({ username })` and removing the `useParams` call (username comes from props).

Read the current `page.jsx` first, copy its full content, adapt the function signature.

**Step 3: Verify the page renders**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add "src/app/station/[username]/page.jsx" "src/app/station/[username]/CreatorStationContent.jsx"
git commit -m "feat: add member profile page at /station/[username] with fallback to creator station"
```

---

## Task 10: Edit Profile Page

**Files:**
- Create: `src/app/account/profile/page.jsx`

**Step 1: Create the edit profile page**

Create `src/app/account/profile/page.jsx`:
```jsx
/**
 * MYSTATION — Edit Profile Page
 * Create/update display name, username, bio, avatar
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/store/playerStore';
import { useProfileStore } from '@/store/profileStore';
import AutoAvatar from '@/components/profile/AutoAvatar';
import { AVATAR_STYLES, PROFILE_LIMITS, TIER_BADGES } from '@/lib/profiles/constants';
import { Check, X, Loader2, Camera } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { email, isSubscribed, supporterTier } = useUserStore();
  const { profile, fetchProfile, updateProfile, checkUsername } = useProfileStore();

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    avatar_style: 'initials',
    avatar_url: '',
    banner_color: '#1e293b',
    show_now_playing: false,
  });
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken', 'invalid'
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) return;
    fetchProfile().then(p => {
      if (p) {
        setForm({
          display_name: p.display_name || '',
          username: p.username || '',
          bio: p.bio || '',
          avatar_style: p.avatar_style || 'initials',
          avatar_url: p.avatar_url || '',
          banner_color: p.banner_color || '#1e293b',
          show_now_playing: p.show_now_playing || false,
        });
      }
      setLoading(false);
    });
  }, [email]);

  // Debounced username check
  useEffect(() => {
    if (!form.username || form.username === profile?.username) {
      setUsernameStatus(null);
      return;
    }
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!regex.test(form.username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const available = await checkUsername(form.username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  async function handleSave() {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return;

    setSaving(true);
    const updates = { ...form };
    if (!profile) updates._isNew = true;

    const result = await updateProfile(updates);
    setSaving(false);

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-white/50 mb-4">Sign in to create your profile</p>
        <Link href="/subscribe" className="px-6 py-3 bg-blue-500 rounded-xl text-white font-semibold">
          Get Started
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-white/40 animate-spin" />
      </div>
    );
  }

  const tier = isSubscribed ? (supporterTier === 'diamond' ? 'diamond' : 'subscriber') : 'free';
  const tierConfig = TIER_BADGES[tier];

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {profile ? 'Update your public profile' : 'Set up your MyStation profile'}
        </p>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8">
          <AutoAvatar
            userId={profile?.user_id || email}
            displayName={form.display_name}
            avatarUrl={form.avatar_url}
            style={form.avatar_style}
            size={96}
            tierBorder={tierConfig.border}
          />
          <p className="text-white/30 text-xs mt-2">Preview</p>
        </div>

        {/* Avatar Style Picker */}
        <div className="mb-6">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">
            Avatar Style
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {AVATAR_STYLES.map(s => (
              <button
                key={s}
                onClick={() => setForm(f => ({ ...f, avatar_style: s, avatar_url: '' }))}
                className={`shrink-0 p-1 rounded-full transition ${
                  form.avatar_style === s && !form.avatar_url
                    ? 'ring-2 ring-blue-500'
                    : 'ring-1 ring-white/10 hover:ring-white/20'
                }`}
              >
                <AutoAvatar
                  userId={profile?.user_id || email}
                  displayName={form.display_name || 'AB'}
                  style={s}
                  size={40}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div className="mb-4">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value.slice(0, PROFILE_LIMITS.displayNameMax) }))}
            maxLength={PROFILE_LIMITS.displayNameMax}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
          <p className="text-white/20 text-xs mt-1 text-right">{form.display_name.length}/{PROFILE_LIMITS.displayNameMax}</p>
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">@</span>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, PROFILE_LIMITS.usernameMax) }))}
              maxLength={PROFILE_LIMITS.usernameMax}
              placeholder="username"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 size={16} className="text-white/30 animate-spin" />}
              {usernameStatus === 'available' && <Check size={16} className="text-green-400" />}
              {usernameStatus === 'taken' && <X size={16} className="text-red-400" />}
              {usernameStatus === 'invalid' && <X size={16} className="text-red-400" />}
            </div>
          </div>
          {usernameStatus === 'taken' && <p className="text-red-400 text-xs mt-1">Username taken</p>}
          {usernameStatus === 'invalid' && <p className="text-red-400 text-xs mt-1">3-20 chars, lowercase letters, numbers, underscores</p>}
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, PROFILE_LIMITS.bioMax) }))}
            maxLength={PROFILE_LIMITS.bioMax}
            placeholder="Tell people about yourself..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500"
          />
          <p className="text-white/20 text-xs mt-1 text-right">{form.bio.length}/{PROFILE_LIMITS.bioMax}</p>
        </div>

        {/* Subscriber-only features */}
        {isSubscribed && (
          <div className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
            <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Subscriber Features</p>

            {/* Banner Color */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm">Banner Color</span>
              <input
                type="color"
                value={form.banner_color}
                onChange={e => setForm(f => ({ ...f, banner_color: e.target.value }))}
                className="w-8 h-8 rounded border-0 cursor-pointer"
              />
            </div>

            {/* Now Playing Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Show Now Playing</span>
              <button
                onClick={() => setForm(f => ({ ...f, show_now_playing: !f.show_now_playing }))}
                className={`w-10 h-6 rounded-full transition ${form.show_now_playing ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${form.show_now_playing ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || !form.username}
          className={`w-full py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check size={18} /> Saved!</>
          ) : (
            profile ? 'Save Changes' : 'Create Profile'
          )}
        </button>

        {profile && (
          <Link
            href={`/station/${profile.username}`}
            className="block text-center text-blue-400 text-sm mt-4 hover:underline"
          >
            View your profile
          </Link>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add "src/app/account/profile/page.jsx"
git commit -m "feat: add edit profile page at /account/profile"
```

---

## Task 11: Badge Award Logic

**Files:**
- Create: `src/lib/profiles/awardBadge.js`
- Modify: `src/app/api/lounge/move/route.js` (add badge awarding after game points)

**Step 1: Create badge award utility**

Create `src/lib/profiles/awardBadge.js`:
```javascript
/**
 * MYSTATION — Badge Award Logic
 * Server-side: checks criteria and awards badges
 */

export async function checkAndAwardBadges(supabase, userId, context) {
  const awarded = [];

  // Get existing badges to avoid re-awarding
  const { data: existing } = await supabase
    .from('badges')
    .select('badge_id')
    .eq('user_id', userId);

  const has = new Set((existing || []).map(b => b.badge_id));

  async function award(badgeId) {
    if (has.has(badgeId)) return;
    const { error } = await supabase
      .from('badges')
      .insert({ user_id: userId, badge_id: badgeId })
      .select()
      .single();
    if (!error) {
      awarded.push(badgeId);
      // Log to activity feed
      await supabase.from('activity_feed').insert({
        user_id: userId,
        type: 'badge_earned',
        data: { badge_id: badgeId },
      });
    }
  }

  // Context: game_win
  if (context.type === 'game_result') {
    // First win
    if (context.isWinner) {
      await award('first_win');
    }

    // Game-specific badges (10 wins)
    if (context.stats) {
      const wins = context.stats.wins + (context.isWinner ? 1 : 0);
      if (context.gameType === 'dominoes' && wins >= 10) await award('domino_master');
      if (context.gameType === 'blackjack' && wins >= 10) await award('card_shark');
      if (context.gameType === 'spades' && wins >= 10) await award('spades_ace');
      if (context.gameType === 'pool' && wins >= 10) await award('pool_hustler');
    }

    // Streak badge
    if (context.newStreak >= 5) {
      await award('streak_5');
    }

    // Perfect quiz
    if (context.gameType === 'quiz' && context.perfectQuiz) {
      await award('quiz_brain');
    }

    // Log game win to activity
    if (context.isWinner) {
      await supabase.from('activity_feed').insert({
        user_id: userId,
        type: 'game_win',
        data: { game_type: context.gameType },
      });
    }
  }

  // Context: subscription
  if (context.type === 'subscription') {
    await award('subscriber');
    if (context.tier === 'diamond') await award('diamond');
  }

  // Context: first_listen
  if (context.type === 'first_listen') {
    await award('first_listen');
  }

  return awarded;
}
```

**Step 2: Add badge check to awardGamePoints in move/route.js**

At the end of the `awardGamePoints` function in `src/app/api/lounge/move/route.js`, after the stats upsert (around line 396), add:

```javascript
// Check and award badges
try {
  const { checkAndAwardBadges } = await import('@/lib/profiles/awardBadge');
  await checkAndAwardBadges(supabase, userId, {
    type: 'game_result',
    gameType: room.game_type,
    isWinner,
    stats: existing || { wins: 0 },
    newStreak: isWinner ? (existing ? existing.current_streak + 1 : 1) : 0,
    perfectQuiz: room.game_type === 'quiz' && isWinner && (() => {
      const pData = gameState.players?.[userId];
      return pData?.answers?.length === gameState.questions?.length && pData?.answers?.every(a => a.correct);
    })(),
  });
} catch (badgeErr) {
  console.error('Badge check error:', badgeErr);
}
```

Insert this AFTER the `if (existing) { ... } else { ... }` block at line ~396, BEFORE the closing `}` of the for loop.

**Step 3: Commit**

```bash
git add "src/lib/profiles/awardBadge.js" "src/app/api/lounge/move/route.js"
git commit -m "feat: add badge award system with game integration"
```

---

## Task 12: Add Profile Link to Account Page & Navigation

**Files:**
- Modify: `src/app/account/page.jsx` (add "Edit Profile" link)

**Step 1: Add profile link to account page**

In `src/app/account/page.jsx`, add a link in the Quick Links section (around line 221-233). Add this link BEFORE the "Browse Music" link:

```jsx
<Link href="/account/profile" className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition group">
  <span className="text-white/70 group-hover:text-white transition">Edit Profile</span>
  <ExternalLink size={16} className="text-white/30" />
</Link>
```

**Step 2: Commit**

```bash
git add "src/app/account/page.jsx"
git commit -m "feat: add Edit Profile link to account page"
```

---

## Task 13: Auto-Create Profile on Subscription

**Files:**
- Modify: `src/app/api/stripe/webhook/route.js` (add profile creation on new subscription)

**Step 1: Read the webhook file to find the right insertion point**

Read `src/app/api/stripe/webhook/route.js` and find the `checkout.session.completed` handler where subscription is confirmed.

**Step 2: Add profile auto-creation**

After the subscriber is confirmed in the webhook handler, add:

```javascript
// Auto-create profile if it doesn't exist
try {
  const encoder = new TextEncoder();
  const emailData = encoder.encode(customerEmail.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', emailData);
  const arr = Array.from(new Uint8Array(hash));
  const subUserId = 'sub_' + arr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', subUserId)
    .single();

  if (!existingProfile) {
    const baseUsername = customerEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20).toLowerCase();
    // Ensure unique username
    let username = baseUsername;
    let attempt = 0;
    while (attempt < 5) {
      const { data: taken } = await supabase.from('profiles').select('id').eq('username', username).single();
      if (!taken) break;
      attempt++;
      username = baseUsername.slice(0, 16) + '_' + Math.random().toString(36).slice(2, 6);
    }

    await supabase.from('profiles').insert({
      user_id: subUserId,
      email: customerEmail,
      username,
      display_name: customerName || 'Music Fan',
      tier: tier || 'subscriber',
    });

    // Award subscriber badge
    const { checkAndAwardBadges } = await import('@/lib/profiles/awardBadge');
    await checkAndAwardBadges(supabase, subUserId, {
      type: 'subscription',
      tier: tier || 'subscriber',
    });
  } else {
    // Update tier if profile exists
    await supabase.from('profiles').update({ tier: tier || 'subscriber' }).eq('user_id', subUserId);
  }
} catch (profileErr) {
  console.error('Auto-create profile error:', profileErr);
  // Non-fatal — don't break subscription flow
}
```

**Step 3: Commit**

```bash
git add "src/app/api/stripe/webhook/route.js"
git commit -m "feat: auto-create profile on new subscription with badge award"
```

---

## Task 14: Build, Test & Deploy

**Step 1: Run the build**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -30
```

Expected: Build succeeds with no errors.

**Step 2: Fix any build errors**

If errors occur, fix them before proceeding.

**Step 3: Run the SQL schema**

Execute the profile schema SQL against Supabase (Task 1, Step 2).

**Step 4: Test locally**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next dev
```

Visit `/account/profile` — should show profile creation form.

**Step 5: Deploy**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel ls 2>&1 | grep -E "Building|Queued"
# If clear:
vercel --prod
```

**Step 6: Verify deploy**

```bash
for p in / /music /search /merch /account/profile; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

Expected: All pages return 200.

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: member profiles system — complete v1 deploy"
```

---

## Summary of All New Files

| File | Purpose |
|------|---------|
| `src/lib/db/profile-schema.sql` | Database schema (5 tables + storage) |
| `src/lib/profiles/badges.js` | 12 badge definitions |
| `src/lib/profiles/constants.js` | Limits, regex, tier config, avatar styles |
| `src/lib/profiles/awardBadge.js` | Server-side badge award logic |
| `src/store/profileStore.js` | Zustand profile state management |
| `src/components/profile/AutoAvatar.jsx` | Auto-generated avatar component (8 styles) |
| `src/app/api/profile/route.js` | Profile CRUD (GET own, PUT update) |
| `src/app/api/profile/check-username/route.js` | Username availability check |
| `src/app/api/profile/[username]/route.js` | Public profile with stats/badges/activity |
| `src/app/api/profile/follow/route.js` | Follow/unfollow toggle |
| `src/app/api/profile/playlists/route.js` | Playlist list/create |
| `src/app/api/profile/playlists/[id]/route.js` | Playlist GET/PUT/DELETE |
| `src/app/station/[username]/page.jsx` | Rewritten — profile first, creator station fallback |
| `src/app/station/[username]/CreatorStationContent.jsx` | Extracted existing creator station code |
| `src/app/account/profile/page.jsx` | Edit profile page |

## Modified Files

| File | Change |
|------|--------|
| `src/app/api/lounge/move/route.js` | Badge awarding after game points |
| `src/app/api/stripe/webhook/route.js` | Auto-create profile on subscription |
| `src/app/account/page.jsx` | Add "Edit Profile" link |
