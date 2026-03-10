# Community Feed — Design Doc

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade existing Fan Wall into a channel-based community feed where subscribers post, free users read, and Mike has a distinct owner presence.

**Architecture:** Extend the `fan_wall` Supabase table with channel, post_type, media_url, poll_options, and is_pinned columns. New `/community` page with channel tabs, post composer, and tiered access (free=read, subscriber=post, Mike=pin+announce). Photo uploads via Supabase Storage, polls via new `community_votes` table.

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres + Storage), Tailwind CSS, Zustand

---

## Channels

- **General** — anything goes, fan chat
- **Music Talk** — track reactions, album discussion, production talk
- **LOTL / Events** — festival hype, who's going
- **Announcements** — Mike-only, pinned posts, new drops
- **Merch** — fit pics, collection flexing, new drop reactions

## Post Types

- **Text** — up to 500 characters
- **Photo** — image upload (Supabase Storage, max 5MB)
- **Poll** — 2-4 options, 24hr/48hr/7-day duration, one vote per user

## User Tiers

| Tier | Can Read | Can React | Can Post | Badge |
|------|----------|-----------|----------|-------|
| Free/Guest | Yes | Yes (emoji) | No | None |
| Subscriber | Yes | Yes | Yes | Purple "SUB" badge |
| Diamond | Yes | Yes | Yes | Diamond badge |
| Mike (Owner) | Yes | Yes | Yes + Pin + Announcements | Gold verified card |

## Components

- `CommunityFeed.jsx` — main feed with channel tabs, infinite scroll
- `CommunityPost.jsx` — individual post card (text/photo/poll variants)
- `CreatePost.jsx` — post composer (text input, photo upload, poll creator)
- `ChannelTabs.jsx` — horizontal scrolling channel selector
- `/community/page.jsx` — new route

## Database Changes

### Alter `fan_wall` table
```sql
ALTER TABLE fan_wall ADD COLUMN channel text DEFAULT 'general';
ALTER TABLE fan_wall ADD COLUMN post_type text DEFAULT 'text';
ALTER TABLE fan_wall ADD COLUMN media_url text;
ALTER TABLE fan_wall ADD COLUMN poll_options jsonb;
ALTER TABLE fan_wall ADD COLUMN is_pinned boolean DEFAULT false;
CREATE INDEX idx_fan_wall_channel ON fan_wall (channel);
CREATE INDEX idx_fan_wall_pinned ON fan_wall (is_pinned) WHERE is_pinned = true;
```

### New `community_votes` table
```sql
CREATE TABLE community_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES fan_wall(id) ON DELETE CASCADE,
  voter_ip_hash text NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, voter_ip_hash)
);
CREATE INDEX idx_community_votes_post ON community_votes (post_id);
```

### Supabase Storage bucket
- Bucket: `community-photos`
- Max file size: 5MB
- Allowed types: image/jpeg, image/png, image/webp
- Public read, authenticated write

## API Routes

### Extend `/api/fan-wall`
- GET: Add `?channel=general` query param for filtering
- POST: Accept `channel`, `post_type`, `media_url`, `poll_options` fields

### New `/api/community/vote`
- POST: `{ postId, optionIndex }` — one vote per IP hash per poll

### New `/api/community/pin`
- POST: `{ postId, pinned }` — admin-only (ADMIN_KEY required)

## Navigation

- Add "Community" to BottomTabBar (replace or add 6th tab)
- Add to desktop Navbar

## Access Control

- Reading: No gate — everyone sees the feed
- Reacting: No gate — emoji reactions open to all
- Posting: Subscriber gate — checks `mystation-sub` cookie
- Announcements channel: Mike-only posting (ADMIN_KEY)
- Pinning: Mike-only (ADMIN_KEY)

## Existing Code (DO NOT duplicate)

- `fan_wall` table + `/api/fan-wall` route — EXTEND, don't recreate
- `FanWall.jsx` — keep as-is on Fan Zone page, community feed is separate component
- `comments` table + `/api/comments` — track comments, unrelated to community
- Fan Zone page — keep as-is (points, streaks, badges, rewards)
- Kickback Lounge chat — game-specific, unrelated
