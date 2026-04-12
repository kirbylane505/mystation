# PodStation — Live Streaming for MyStation

**Date:** April 6, 2026
**Status:** Approved
**Route:** `/podstation`

## What It Is

A live streaming tab inside MyStation where anyone can go live with
camera/mic while playing MyStation music as background. Viewers watch
video + hear voice on one channel, MyStation music plays independently
through the existing player. Live chat with emoji reactions.

## Rules

| Rule | Detail |
|------|--------|
| Who can stream | Anyone with an email (free) |
| Who can charge | $14.99/mo subscribers only |
| Who can watch | Anyone |
| Music | Streamer picks MyStation tracks, plays through viewer's own player |
| Chat | Live sidebar, fire emoji, tap message/emoji to see who sent it |
| Replays | Streamer chooses to save or not |
| Titles | Custom title, no categories |
| Platform | Mobile + desktop |

## Quality Specs

| Spec | Value |
|------|-------|
| Max Video | 4K (3840x2160) @ 30fps |
| Adaptive Bitrate | Auto-scales: 4K > 1080p > 720p > 480p based on viewer connection |
| Audio Codec | Opus @ 256kbps, 48kHz stereo |
| Latency | Sub-second (100-300ms) via WebRTC |

## Tech Stack

**LiveKit** (open source WebRTC)
- Phase 1: Self-hosted on VPS ($20-40/mo)
- Phase 2: LiveKit Cloud for global scale
- React SDK: `@livekit/components-react`
- Server SDK: `livekit-server-sdk` (token generation in Next.js API routes)
- Chat: Built-in via WebRTC data channels
- Recording: LiveKit Egress to Cloudflare R2
- Open source (Apache 2.0) — no vendor lock-in

## Navigation

- New tab: PodStation (alongside Home, Music, Community, Merch, Lounge, Events)
- Route: `/podstation`
- Icon: Radio or Podcast from lucide-react
- Mobile BottomTabBar: Add as scrollable tab or replace one slot

## Screens

### 1. PodStation Grid (`/podstation`)
- Grid of live stream cards
- Each card: thumbnail, streamer name, title, viewer count, live duration
- Sorted by most viewers first
- "Go Live" button top right
- Empty state: "No one's live yet. Be the first."

### 2. Stream View (`/podstation/[id]`)
- 4K video player (main area)
- Chat sidebar (desktop) / overlay (mobile)
- Fire emoji button + comment input
- Tap any message/emoji -> dropdown: username, profile pic, "View Profile"
- MyStation player at bottom, independent audio
- Streamer info bar: name, title, viewer count, follow
- If paid stream: pay gate before entering

### 3. Go Live Screen
- Camera preview with mic level indicator
- Type a title
- Toggle: "Save replay"
- Toggle: "Charge viewers" ($14.99 subscribers only, grayed out otherwise)
- If charging: set price
- Pick MyStation track for background (optional)
- Camera/mic select dropdowns
- Quality indicator (shows resolution being captured)
- "Start Streaming" button

### 4. Chat
- Real-time messages via LiveKit data channels
- Fire emoji reaction (one tap)
- Each message: username + text
- Tap message/emoji -> dropdown: profile pic, username, "View Profile"
- Streamer moderation: delete messages, mute users

## File Architecture

```
/src/app/podstation/
  page.jsx              — Grid of live streams
  [id]/page.jsx         — Watch a stream
  go-live/page.jsx      — Start streaming

/src/app/api/podstation/
  token/route.js        — Generate LiveKit JWT
  rooms/route.js        — List active rooms for grid
  record/route.js       — Start/stop replay recording (Egress)

/src/components/podstation/
  PodStationGrid.jsx    — Stream card grid
  StreamCard.jsx        — Individual stream thumbnail card
  StreamView.jsx        — 4K video player + chat layout
  LiveChat.jsx          — Chat sidebar with emoji reactions
  ChatMessage.jsx       — Single message with user dropdown
  GoLivePanel.jsx       — Camera preview + settings
  EmojiReaction.jsx     — Fire emoji with sender dropdown
```

## Database (Supabase)

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  is_live BOOLEAN DEFAULT false,
  viewer_count INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  price DECIMAL(10,2),
  livekit_room_id TEXT,
  save_replay BOOLEAN DEFAULT false,
  replay_url TEXT,
  thumbnail_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT,
  emoji TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Shareable Stream Links

Every live stream gets a shareable URL:
`mystationlive.com/podstation/[stream-id]`

- Streamer can copy link and share anywhere: IG, Twitter/X, text, DM, email
- Share button in Go Live screen + stream view (same custom share modal as music)
- OG meta tags on stream pages: thumbnail, streamer name, title, "LIVE NOW" badge
- og:title: "[Streamer Name] is LIVE on MyStation"
- og:description: "[Stream Title]"
- og:image: Stream thumbnail or streamer profile pic with LIVE badge overlay

**Viewer flow from shared link:**
1. Click link from any platform
2. Land on `/podstation/[id]`
3. Email gate (if not logged in) — enter email, instant access
4. Immediately in the live stream — video + chat
5. No app download, no signup form, no paywall (unless streamer is charging)

**OG preview must show:**
- LIVE indicator (red dot or badge)
- Streamer name + title
- Viewer count (if available via server-side render)
- MyStation branding

This follows the same pattern as the Shared Link Play System (music tracks).

## Monetization

- Free to stream, free to watch
- Streamers who want to charge viewers must be on $14.99/mo tier
- Paid streams: viewer pays before entering the stream
- Revenue split TBD (streamer % vs MyStation %)
- Free play mode stays until 10K users

## Quality Comparison

| Platform | Max Video | Audio | Latency |
|----------|-----------|-------|---------|
| Twitch | 1080p60 (4K for partners) | AAC 320kbps | 2-5s |
| PodStation | 4K30 | Opus 256kbps | <1s |
| YouTube Live | 4K60 | AAC 256kbps | 3-10s |

PodStation matches or beats Twitch on every spec.
