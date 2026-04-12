# Creator Station v2 — Full Rebuild Design

**Date:** 2026-04-07
**Status:** Approved
**Goal:** Fix creator station for all creators — kill fake system, unify on real Supabase backend, add follow system, live streaming integration, video saves, creator messaging, profile customization

---

## Problem

Two separate creator systems exist:
- **System A (Fake):** localStorage/Zustand at `/station/*` — no persistence, no auth, no monetization
- **System B (Real):** Supabase + Stripe at `/creators/*` + `/dashboard/*` — functional but not wired into nav

Navbar points to System A. System B is buried. Creators can't customize profiles. No free follow option — only paid subscription. No way to save live streams as videos. No creator-to-creator communication.

## Solution

Kill System A. Unify everything on System B. Add follow system, video saves, messaging, and profile editing.

---

## 1. Kill System A

**Delete these files:**
- `src/store/stationStore.js`
- `src/app/station/create/page.jsx`
- `src/app/station/dashboard/page.jsx`
- `src/app/station/[username]/page.jsx`
- `src/app/station/[username]/CreatorStationContent.jsx`

**Redirect (in case of bookmarks):**
- `/station/create` → `/creators/signup`
- `/station/dashboard` → `/dashboard`
- `/station/[username]` → `/artist/[username]`

## 2. Public Creator Profile (`/artist/[slug]`)

Single page layout, top to bottom:

```
┌─────────────────────────────────────┐
│  BANNER IMAGE (creator-customizable)│
│  ┌──────┐                           │
│  │AVATAR│  Display Name             │
│  └──────┘  Category · Genre Tags    │
│  🔴 LIVE NOW     [Follow] [Subscribe to MyStation] │
│  1.2K followers · 45 tracks         │
├─────────────────────────────────────┤
│  BIO                                │
├─────────────────────────────────────┤
│  🔴 LIVE STREAM (when live)         │
├─────────────────────────────────────┤
│  📹 VIDEOS (saved live streams)     │
├─────────────────────────────────────┤
│  🎵 TRACKS                          │
├─────────────────────────────────────┤
│  👕 MERCH                            │
└─────────────────────────────────────┘
```

**Two CTAs:**
- **Follow** (FREE) — email + push notification opt-in. Alerts for live streams + new releases
- **Subscribe to MyStation** ($4.99/mo) — full music access across all creators

## 3. Follow System (Free, No Paywall)

```sql
CREATE TABLE creator_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  follower_email TEXT NOT NULL,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, follower_email)
);
CREATE INDEX idx_creator_followers_creator ON creator_followers(creator_id);
CREATE INDEX idx_creator_followers_email ON creator_followers(follower_email);
```

- No login required — just email + browser push permission
- Works for non-subscribers, subscribers, everyone
- Follow count displayed on creator profile
- Followers get push notifications for: live streams, new tracks, new videos

## 4. Live Streaming (1000+ Viewers)

LiveKit Cloud SFU architecture (already deployed in PodStation Phase 2):
- Host streams via WebRTC (camera + mic)
- Viewers receive via WebRTC (watch-only)
- LiveKit SFU handles 1000+ concurrent viewers natively
- Chat via `stream_chat` table (already exists)
- Donations via Stripe (already wired)

When creator goes live:
- `creators.is_live = true`, `creators.current_stream_id` set
- LIVE badge appears on their `/artist/[slug]` page
- Push notification sent to all followers
- Stream embeds directly on their profile page

## 5. Save Live Streams to Video Page

```sql
CREATE TABLE creator_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  stream_id TEXT,
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_creator_videos_creator ON creator_videos(creator_id);
```

Flow:
1. Creator goes live → LiveKit Egress records automatically
2. Stream ends → prompt: "Save to your video page?" [Save] [Discard]
3. If Save → upload to R2 → insert into `creator_videos`
4. Video appears on `/artist/[slug]` under Videos section

## 6. Creator Profile Editing (FB/IG Style)

Dashboard settings at `/dashboard/settings`:
- **Profile pic** — upload, stored in Supabase Storage
- **Banner image** — upload
- **Display name** — editable
- **Bio** — plain text
- **Category** — dropdown (Musician, Fitness & Wellness, Podcaster, DJ, Content Creator)
- **Genre tags** — for discovery
- **Social links** — IG, Twitter, TikTok, YouTube

All changes update `creators` table. Profile page reflects changes immediately.

## 7. Creator-to-Creator Messaging

```sql
CREATE TABLE creator_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_creator_messages_receiver ON creator_messages(receiver_id, read);
CREATE INDEX idx_creator_messages_conversation ON creator_messages(sender_id, receiver_id);
```

- DM inbox at `/dashboard/messages`
- Message button on creator profiles (only visible to other creators)
- Unread badge count in dashboard nav
- Polling-based updates (v1 — simple)

## 8. Push Notification Flow

```
Creator goes live
  → LiveKit webhook fires
  → /api/livekit/webhook sets creator.is_live = true
  → Query creator_followers for push_subscriptions
  → web-push sends "Nat is LIVE! Tune in now" to all followers

Creator uploads track
  → /api/creators/upload saves track
  → Query creator_followers
  → web-push sends "Nat dropped a new track: [title]"

Creator saves video
  → /api/creators/videos saves video
  → Query creator_followers
  → web-push sends "Nat posted a new video: [title]"
```

## 9. Navigation Changes

| Location | Current | New |
|---|---|---|
| Navbar CTA | "Create Station" → `/station/create` | "Create Station" → `/creators/signup` |
| Navbar (logged-in creator) | "My Station" → `/station/dashboard` | "My Station" → `/dashboard` |
| Browse page links | `/artist/[slug]` | No change |
| BottomTabBar | No creator link | Add "Creators" tab |

## 10. Database Changes Summary

**New tables:** `creator_followers`, `creator_videos`, `creator_messages`

**Alter `creators` table:**
```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS current_stream_id TEXT;
```

## 11. API Routes (New + Modified)

| Route | Method | Purpose |
|---|---|---|
| `/api/creators/follow` | POST/DELETE | Follow/unfollow (fix existing) |
| `/api/creators/videos` | GET/POST | List/save creator videos |
| `/api/creators/messages` | GET/POST | DM inbox + send |
| `/api/creators/messages/[id]/read` | PATCH | Mark as read |
| `/api/creators/settings` | PUT | Update profile (avatar, banner, bio, etc.) |
| `/api/creators/upload-image` | POST | Upload profile pic/banner to Supabase Storage |
| `/api/creators/notify` | POST | Send push to followers (internal) |

## 12. Scale Considerations

- LiveKit SFU: 1000+ viewers per stream (WebRTC, server-side mixing)
- Push notifications: batch send via web-push (100/batch)
- Video storage: R2 CDN (unlimited, cheap)
- Database: Supabase indexes on all FK columns + status fields

## Not In Scope (v1)

- Custom colors/themes for creator pages
- Paid follower tiers
- Analytics sharing with followers
- Video editing/trimming
- Scheduled streams
