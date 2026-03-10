# Phase 1: App Store Polish — UX + Audio Quality + Discovery Engine

**Date:** March 5, 2026
**Status:** APPROVED
**Goal:** Polish MyStation before first App Store users arrive. All web-side changes = instant in iOS app.

---

## Section 1: UX Polish

### 1.1 Page Load Speed
- Skeleton loaders on music, merch, videos pages (no blank screens)
- Lazy load images below fold (album art, merch photos)
- Preload first 3 tracks in any list for instant playback

### 1.2 Player Bar Refinement
- Smoother progress bar (CSS transition)
- Swipe-up full-screen "Now Playing" view: album art, queue, blur backdrop
- Haptic feedback on play/pause/skip (iOS)

### 1.3 Mobile Navigation
- Bottom tab bar for mobile: Music, Search, Shop, Lounge, Account
- Keep top navbar for desktop
- Smooth page transitions via Framer Motion (fade/slide)
- Pull-to-refresh on key pages

### 1.4 Visual Consistency
- Consistent card sizing across all pages
- Loading states for every API-triggering button
- Toast notifications consistent everywhere

### 1.5 Mobile-First Fixes
- Touch targets minimum 44x44px (Apple HIG)
- No horizontal scroll anywhere
- Minimum 14px body font
- Safe area padding for notch/Dynamic Island

---

## Section 2: Audio Quality Upgrade

### 2.1 Track Format
- Convert all ~140 tracks: MP3 -> M4A AAC 256kbps 44.1kHz
- Two-pass loudnorm -14 LUFS
- Command: `ffmpeg -i input.mp3 -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 256k -ar 44100 output.m4a`

### 2.2 Quality Badge
- "HQ" badge on player for subscribers streaming high-quality
- Free users see "Standard"

### 2.3 Spatial Audio Metadata
- Add spatial audio metadata tags to stereo masters
- Apple devices apply Spatial Audio processing from metadata

### 2.4 CDN + API Updates
- Upload M4A files to Cloudflare R2
- Update tracks.js audioFile paths .mp3 -> .m4a
- Update stream API Content-Type to audio/mp4

---

## Section 3: Discovery Engine

### 3.1 "For You" Homepage Section
- Algorithm: play history + genre affinity + time of day + similar listener data
- New users: trending + editor's picks + highest hitScore tracks
- Data source: analytics_events table in Supabase

### 3.2 "If You Like This" on Track Pages
- Show 4-6 related tracks per song
- Match: same album > BPM +-10 > same key > same producer > same featured

### 3.3 Mood Playlists (Curated)
- Pre-built: "Late Night Vibes", "Workout Mode", "Chill & Focus", "Turn Up", "Throwback"
- Curated track ID arrays in data file
- Horizontal scroll cards on homepage + music page

### 3.4 Trending Section
- Top 10 most-played tracks in last 7 days (analytics_events)
- Daily cron update
- Play count + trend direction (up/down/new)

### 3.5 Search Suggestions
- Pre-type: recent searches, trending, popular tracks
- Typeahead as user types

---

## Architecture Notes

- All changes are web-side (Next.js app at mystationlive.com)
- iOS app (WKWebView wrapper) gets all changes instantly on deploy
- No App Store resubmission needed for Phase 1
- Existing Service Worker (sw.js v5) handles caching — update cache version after changes
- Audio gating system (FREE_TRACK_IDS = [500, 501]) remains UNTOUCHED

## Files to Modify

**UX Polish:**
- src/components/AudioPlayer.jsx (player refinement)
- src/components/Player.jsx (now playing expansion)
- src/components/Navbar.jsx (bottom tab bar)
- src/app/layout.jsx (navigation structure)
- New: src/components/BottomTabBar.jsx
- New: src/components/NowPlaying.jsx
- New: src/components/SkeletonLoader.jsx

**Audio Quality:**
- src/data/tracks.js (audioFile paths)
- src/app/api/audio/stream/route.js (content-type headers)
- public/audio/ (converted M4A files)
- src/components/AudioPlayer.jsx (HQ badge)

**Discovery:**
- New: src/components/ForYou.jsx
- New: src/components/RelatedTracks.jsx
- New: src/components/MoodPlaylists.jsx
- New: src/components/TrendingTracks.jsx
- New: src/app/api/discover/route.js
- New: src/app/api/trending/route.js
- src/data/tracks.js (mood playlist arrays)
- src/app/page.jsx (homepage sections)
- src/app/music/page.jsx (discovery sections)
- src/components/SearchBar.jsx (suggestions)
