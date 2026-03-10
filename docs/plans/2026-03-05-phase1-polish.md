# Phase 1: App Store Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish MyStation before first App Store users arrive — UX refinement, audio quality upgrade, and discovery engine. All web-side changes go live instantly in the iOS app.

**Architecture:** Three parallel workstreams: (1) UX Polish adds bottom tab bar, skeleton loaders, full-screen Now Playing, and mobile-first fixes. (2) Audio Quality converts tracks to M4A AAC 256kbps and adds HQ badge. (3) Discovery Engine adds For You, Related Tracks, Trending, Mood Playlists, and search suggestions. All changes are in the Next.js web app — the iOS WKWebView wrapper picks them up automatically.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS 4, Zustand, Framer Motion, Supabase, ffmpeg

---

## Task 1: Skeleton Loader Component

**Files:**
- Create: `src/components/SkeletonLoader.jsx`

**Step 1: Create skeleton loader component**

```jsx
'use client';

export function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />;
}

export function TrackSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <SkeletonPulse className="w-10 h-10 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
          <SkeletonPulse className="w-10 h-3" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <SkeletonPulse className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full aspect-[16/7] md:aspect-[16/5]">
      <SkeletonPulse className="w-full h-full rounded-none" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/SkeletonLoader.jsx
git commit -m "feat: add skeleton loader components for loading states"
```

---

## Task 2: Bottom Tab Bar (Mobile Navigation)

**Files:**
- Create: `src/components/BottomTabBar.jsx`
- Modify: `src/app/layout.jsx` (add BottomTabBar import + render)

**Step 1: Create BottomTabBar component**

```jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Search, ShoppingBag, User } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/music', icon: Music, label: 'Music' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/merch', icon: ShoppingBag, label: 'Shop' },
  { href: '/account', icon: User, label: 'Account' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  // Hide on desktop, hide during games (landscape lounge)
  const isLounge = pathname?.startsWith('/lounge/') && pathname !== '/lounge';

  if (isLounge) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                active ? 'text-blue-400' : 'text-white/40 active:text-white/60'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 2: Add BottomTabBar to layout.jsx**

In `src/app/layout.jsx`, add import at top with other imports:
```jsx
import BottomTabBar from '@/components/BottomTabBar';
```

Add `<BottomTabBar />` right after `<Player />` in the JSX body.

Also add bottom padding to main content area so content isn't hidden behind the tab bar. Find the `<main>` or content wrapper and add `pb-16 md:pb-0` class.

**Step 3: Commit**

```bash
git add src/components/BottomTabBar.jsx src/app/layout.jsx
git commit -m "feat: add mobile bottom tab bar navigation (iOS/Android standard)"
```

---

## Task 3: Full-Screen Now Playing View

**Files:**
- Create: `src/components/NowPlaying.jsx`
- Modify: `src/components/Player.jsx` (add expand trigger to open NowPlaying)

**Step 1: Create NowPlaying component**

Build a full-screen overlay that shows:
- Large album art (centered, ~280px on mobile)
- Track title + artist
- Full seek bar (reuse existing SeekBar component)
- Play/Pause/Skip/Previous controls (large, 56px touch targets)
- Volume slider (if not iOS)
- Shuffle + Repeat toggles
- Queue button (shows upcoming tracks)
- Close/minimize button
- Blurred album art background

Key details:
- Import `usePlayerStore` for all player state
- Import `albums` from tracks.js for album art lookup
- Use `getAlbumArt()` helper (same logic as Player.jsx line 61-66)
- Animate in/out with CSS transform translateY
- Close on swipe-down gesture (track touch start/move/end)
- Background: album art at 20% opacity with 40px blur

**Step 2: Wire expand trigger in Player.jsx**

In `src/components/Player.jsx`, the `expanded` state already exists (line 121). Modify the existing expand behavior to render `<NowPlaying />` as a portal/overlay instead of inline expansion. The existing ChevronUp button at the top of the mini player triggers `setExpanded(true)` — keep that, but render NowPlaying when expanded is true.

**Step 3: Commit**

```bash
git add src/components/NowPlaying.jsx src/components/Player.jsx
git commit -m "feat: add full-screen Now Playing view with blurred album art background"
```

---

## Task 4: Loading States on All Buttons

**Files:**
- Modify: `src/app/page.jsx` (merch fetch loading state)
- Modify: `src/components/SubscribeModal.jsx` (subscribe button loading)

**Step 1: Add loading states**

For any button that triggers an API call, wrap the onClick with a loading state pattern:

```jsx
const [loading, setLoading] = useState(false);

const handleClick = async () => {
  setLoading(true);
  try {
    await apiCall();
  } finally {
    setLoading(false);
  }
};

// In JSX:
<button disabled={loading} className="...">
  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Subscribe'}
</button>
```

Apply this to:
- Subscribe buttons in SubscribeModal
- Add to Cart buttons on merch pages
- Checkout button
- Any form submit button

Most of these already have loading states (check first). Only add where missing.

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add loading spinners to all API-triggering buttons"
```

---

## Task 5: Mobile-First CSS Fixes

**Files:**
- Modify: `src/styles/globals.css` (safe area, touch targets, font floor)
- Modify: `src/app/layout.jsx` (viewport meta)

**Step 1: Add global mobile fixes to globals.css**

```css
/* Safe area padding for notch/Dynamic Island */
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

/* Minimum touch targets — Apple HIG 44x44px */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Exception for inline text links and tiny icon buttons */
.inline-link, .icon-btn-sm {
  min-height: unset;
  min-width: unset;
}

/* Prevent horizontal overflow */
html, body {
  overflow-x: hidden;
}

/* Minimum readable font */
body {
  font-size: max(14px, 1rem);
}
```

**Step 2: Verify viewport meta in layout.jsx**

Check that the viewport meta tag in layout.jsx metadata includes `viewport-fit=cover` for safe area support:
```jsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};
```

**Step 3: Commit**

```bash
git add src/styles/globals.css src/app/layout.jsx
git commit -m "fix: mobile-first CSS — safe areas, touch targets, font floor, no h-scroll"
```

---

## Task 6: Audio Quality — Convert Tracks to M4A AAC 256kbps

**Files:**
- Modify: All files in `public/audio/` (MP3 → M4A conversion)
- Create: `scripts/convert-audio.sh` (batch conversion script)

**Step 1: Create conversion script**

```bash
#!/bin/bash
# Convert all MP3s to M4A AAC 256kbps with -14 LUFS loudnorm
# Two-pass loudnorm for accuracy

AUDIO_DIR="/Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation/public/audio"

find "$AUDIO_DIR" -name "*.mp3" -type f | while read -r mp3; do
  m4a="${mp3%.mp3}.m4a"
  if [ -f "$m4a" ]; then
    echo "SKIP (exists): $m4a"
    continue
  fi
  echo "Converting: $mp3"

  # Two-pass loudnorm
  STATS=$(ffmpeg -i "$mp3" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | tail -12)

  MI=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['input_i'])" 2>/dev/null || echo "-14")
  MTP=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['input_tp'])" 2>/dev/null || echo "-1")
  MLRA=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['input_lra'])" 2>/dev/null || echo "11")
  MTH=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['input_thresh'])" 2>/dev/null || echo "-24")
  MO=$(echo "$STATS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['target_offset'])" 2>/dev/null || echo "0")

  ffmpeg -i "$mp3" \
    -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTH:offset=$MO:linear=true" \
    -c:a aac -b:a 256k -ar 44100 \
    -movflags +faststart \
    "$m4a" -y 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "OK: $m4a"
  else
    echo "FAIL: $mp3"
  fi
done

echo "Done. Count:"
find "$AUDIO_DIR" -name "*.m4a" | wc -l
```

**Step 2: Run the conversion script**

```bash
chmod +x scripts/convert-audio.sh
bash scripts/convert-audio.sh
```

This will take ~10-20 minutes for ~140 tracks. Run in background.

**Step 3: Commit script**

```bash
git add scripts/convert-audio.sh
git commit -m "feat: add M4A AAC 256kbps conversion script (Apple Music standard)"
```

---

## Task 7: Update Track Paths and Stream API for M4A

**Files:**
- Modify: `src/data/tracks.js` (change all `.mp3` → `.m4a` in audioFile paths)
- Modify: `src/app/api/audio/stream/route.js` (add m4a content-type)

**Step 1: Update tracks.js**

Use find-and-replace across tracks.js:
- Replace all `.mp3'` with `.m4a'`
- Replace all `.mp3"` with `.m4a"`

This changes every `audioFile: '/audio/singles/Mike Page - Song.mp3'` to `.m4a`.

**Step 2: Update stream route content-type**

In `src/app/api/audio/stream/route.js` at line 139, change:
```javascript
const contentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
```
to:
```javascript
const contentType = ext === 'wav' ? 'audio/wav' : ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
```

**Step 3: Commit**

```bash
git add src/data/tracks.js src/app/api/audio/stream/route.js
git commit -m "feat: switch all tracks to M4A AAC 256kbps, update stream API content-type"
```

---

## Task 8: HQ Audio Badge on Player

**Files:**
- Modify: `src/components/Player.jsx` (add HQ badge near track title)

**Step 1: Add HQ badge**

In `src/components/Player.jsx`, near the track title display, add a small badge:

```jsx
{/* HQ Badge — shows for M4A tracks */}
{currentTrack?.audioFile?.endsWith('.m4a') && (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 ml-2">
    HQ
  </span>
)}
```

Place this right after the track title text in both the mini player and expanded player views.

**Step 2: Commit**

```bash
git add src/components/Player.jsx
git commit -m "feat: add HQ audio quality badge to player for M4A tracks"
```

---

## Task 9: Discovery — Trending Tracks API

**Files:**
- Create: `src/app/api/trending/route.js`

**Step 1: Create trending API endpoint**

```javascript
/**
 * MYSTATION - Trending Tracks
 * Returns top 10 most-played tracks in the last 7 days
 */

import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return Response.json({ tracks: [] });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analytics_events')
      .select('track_title')
      .eq('event_type', 'stream')
      .gte('created_at', sevenDaysAgo)
      .not('track_title', 'is', null);

    if (error || !data) {
      return Response.json({ tracks: [] });
    }

    // Count plays per track
    const counts = {};
    data.forEach(row => {
      const title = row.track_title;
      counts[title] = (counts[title] || 0) + 1;
    });

    // Sort by play count, take top 10
    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, plays]) => ({ title, plays }));

    return Response.json({ tracks: trending });
  } catch {
    return Response.json({ tracks: [] });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/trending/route.js
git commit -m "feat: add trending tracks API — top 10 most played in 7 days"
```

---

## Task 10: Discovery — Related Tracks Component

**Files:**
- Create: `src/components/RelatedTracks.jsx`

**Step 1: Create RelatedTracks component**

```jsx
'use client';

import { useMemo } from 'react';
import { tracks, albums } from '@/data/tracks';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, Lock } from 'lucide-react';
import Image from 'next/image';

function getAlbumArt(track) {
  if (!track) return '/images/idmg-logo-white.png';
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || '/images/idmg-logo-white.png';
}

export default function RelatedTracks({ trackId, limit = 6 }) {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);

  const related = useMemo(() => {
    const source = tracks.find(t => t.id === trackId);
    if (!source) return [];

    // Score each track by similarity
    const scored = tracks
      .filter(t => t.id !== trackId && !t.isVault && !t.comingSoon)
      .map(t => {
        let score = 0;
        // Same album = highest relevance
        if (t.albumId && t.albumId === source.albumId) score += 50;
        // Same producer
        if (t.producer && source.producer && t.producer === source.producer) score += 30;
        // Similar BPM (within ±15)
        if (t.bpm && source.bpm && Math.abs(t.bpm - source.bpm) <= 15) score += 20;
        // Same key
        if (t.key && source.key && t.key === source.key) score += 15;
        // Same featured artist
        if (t.featured && source.featured && t.featured === source.featured) score += 25;
        // High hit score bonus
        if (t.hitScore >= 85) score += 10;
        return { ...t, score };
      })
      .filter(t => t.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }, [trackId, limit]);

  if (related.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold text-white mb-4">If You Like This</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {related.map(track => {
          const gated = isGated(track.id);
          const playing = currentTrack?.id === track.id && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => !gated && setQueue([track], 0)}
              className={`text-left rounded-xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] transition group ${
                gated ? 'opacity-50' : ''
              }`}
            >
              <div className="relative aspect-square">
                <Image
                  src={getAlbumArt(track)}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {gated ? <Lock size={24} className="text-white/70" /> : playing ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-white" />}
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-white truncate">{track.title}</p>
                <p className="text-xs text-white/40 truncate">{track.featured ? `ft. ${track.featured}` : 'Mike Page'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/RelatedTracks.jsx
git commit -m "feat: add Related Tracks component — BPM, key, producer, album matching"
```

---

## Task 11: Discovery — Mood Playlists

**Files:**
- Create: `src/data/moodPlaylists.js`
- Create: `src/components/MoodPlaylists.jsx`

**Step 1: Create mood playlist data**

```javascript
/**
 * MYSTATION - Curated Mood Playlists
 * Hand-picked track IDs for different vibes
 */

export const moodPlaylists = [
  {
    id: 'late-night',
    title: 'Late Night Vibes',
    description: 'Smooth cuts for the late hours',
    gradient: 'from-indigo-900 to-purple-900',
    icon: '🌙',
    trackIds: [100, 101, 500, 21, 22, 30, 31, 35, 40, 41],
  },
  {
    id: 'turn-up',
    title: 'Turn Up',
    description: 'Energy. Period.',
    gradient: 'from-red-900 to-orange-900',
    icon: '🔥',
    trackIds: [102, 103, 104, 23, 32, 33, 34, 42, 43, 44],
  },
  {
    id: 'chill',
    title: 'Chill & Focus',
    description: 'Lock in. Zone out.',
    gradient: 'from-cyan-900 to-teal-900',
    icon: '🎧',
    trackIds: [501, 100, 21, 30, 35, 40, 50, 51, 52, 53],
  },
  {
    id: 'throwback',
    title: 'Throwback',
    description: 'The classics that started it all',
    gradient: 'from-amber-900 to-yellow-900',
    icon: '⏪',
    trackIds: [50, 51, 52, 53, 54, 55, 56, 57, 60, 61],
  },
  {
    id: 'workout',
    title: 'Workout Mode',
    description: 'Push through. No excuses.',
    gradient: 'from-green-900 to-emerald-900',
    icon: '💪',
    trackIds: [102, 103, 104, 32, 33, 34, 42, 43, 23, 44],
  },
];
```

NOTE: The track IDs above are placeholders — update with actual IDs from tracks.js that match each mood. Use BPM + key + vibe to categorize.

**Step 2: Create MoodPlaylists component**

```jsx
'use client';

import { moodPlaylists } from '@/data/moodPlaylists';
import { tracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';
import { Play } from 'lucide-react';

export default function MoodPlaylists() {
  const setQueue = usePlayerStore(s => s.setQueue);

  const playMood = (playlist) => {
    const moodTracks = playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean);
    if (moodTracks.length > 0) {
      setQueue(moodTracks, 0);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-6">Mood Playlists</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {moodPlaylists.map(playlist => (
          <button
            key={playlist.id}
            onClick={() => playMood(playlist)}
            className={`flex-shrink-0 w-40 h-40 rounded-2xl bg-gradient-to-br ${playlist.gradient} p-4 flex flex-col justify-between group hover:scale-[1.03] transition-transform`}
          >
            <span className="text-3xl">{playlist.icon}</span>
            <div>
              <p className="text-sm font-bold text-white text-left">{playlist.title}</p>
              <p className="text-[10px] text-white/60 text-left">{playlist.description}</p>
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
              <Play size={20} className="text-white" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
```

**Step 3: Commit**

```bash
git add src/data/moodPlaylists.js src/components/MoodPlaylists.jsx
git commit -m "feat: add curated mood playlists — 5 vibes with gradient cards"
```

---

## Task 12: Discovery — Trending Section Component

**Files:**
- Create: `src/components/TrendingTracks.jsx`

**Step 1: Create TrendingTracks component**

```jsx
'use client';

import { useState, useEffect } from 'react';
import { tracks, albums } from '@/data/tracks';
import { usePlayerStore, isGated } from '@/store/playerStore';
import { Play, Pause, TrendingUp, Lock, Flame } from 'lucide-react';
import Image from 'next/image';

function getAlbumArt(track) {
  if (!track) return '/images/idmg-logo-white.png';
  if (track.coverArt) return track.coverArt;
  const album = albums.find(a => a.id === track.albumId);
  return album?.coverImage || '/images/idmg-logo-white.png';
}

export default function TrendingTracks() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const setQueue = usePlayerStore(s => s.setQueue);

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(data => {
        // Match trending titles to track objects
        const matched = (data.tracks || [])
          .map(t => {
            const track = tracks.find(tr => {
              const filename = tr.audioFile?.split('/').pop() || '';
              return filename === t.title || tr.title.toLowerCase().includes(t.title.toLowerCase().replace(/_mastered/i, '').replace(/\.m4a|\.mp3/i, ''));
            });
            return track ? { ...track, plays: t.plays } : null;
          })
          .filter(Boolean);
        setTrending(matched);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-6">
        <Flame size={20} className="text-orange-400" />
        <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
      </div>
      <div className="glass rounded-2xl divide-y divide-white/[0.04]">
        {trending.slice(0, 10).map((track, i) => {
          const gated = isGated(track.id);
          const playing = currentTrack?.id === track.id && isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => !gated && setQueue(trending, i)}
              className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition text-left"
            >
              <span className="text-sm font-bold text-white/30 w-6 text-center">{i + 1}</span>
              <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                <Image src={getAlbumArt(track)} alt={track.title} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{track.title}</p>
                <p className="text-xs text-white/40 truncate">{track.featured ? `ft. ${track.featured}` : 'Mike Page'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/30">{track.plays} plays</span>
                {gated ? (
                  <Lock size={14} className="text-white/30" />
                ) : playing ? (
                  <Pause size={16} className="text-blue-400" />
                ) : (
                  <Play size={16} className="text-white/40" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TrendingTracks.jsx
git commit -m "feat: add Trending Tracks component — top 10 from analytics data"
```

---

## Task 13: Discovery — Search Suggestions

**Files:**
- Modify: `src/app/search/page.jsx` (add pre-search suggestions)

**Step 1: Add search suggestions before typing**

In `src/app/search/page.jsx`, add a suggestions section that shows when the search input is focused but empty (or before any search is performed). Show:

1. **Recent searches** — store in localStorage key `mystation-recent-searches` (array of strings, max 5)
2. **Popular tracks** — hardcoded top 5 from tracks.js by hitScore
3. **Quick actions** — "Browse Albums", "Mood Playlists", "Trending"

Save searches to localStorage on successful search. Display suggestions as a list below the search input when `query.length === 0 && !searched`.

**Step 2: Commit**

```bash
git add src/app/search/page.jsx
git commit -m "feat: add search suggestions — recent searches, popular tracks, quick actions"
```

---

## Task 14: Wire Discovery into Homepage

**Files:**
- Modify: `src/app/page.jsx` (add MoodPlaylists, TrendingTracks sections)

**Step 1: Import and add discovery components**

At the top of `src/app/page.jsx`, add:
```jsx
import MoodPlaylists from '@/components/MoodPlaylists';
import TrendingTracks from '@/components/TrendingTracks';
```

In the JSX, add these sections between the existing "New Releases" and "Albums & Projects" sections:

```jsx
{/* Mood Playlists */}
<section className="max-w-screen-xl mx-auto px-6 py-12">
  <MoodPlaylists />
</section>

{/* Trending This Week */}
<section className="max-w-screen-xl mx-auto px-6 py-12">
  <TrendingTracks />
</section>
```

**Step 2: Commit**

```bash
git add src/app/page.jsx
git commit -m "feat: add Mood Playlists and Trending Tracks to homepage"
```

---

## Task 15: Upload M4A Files to R2 and Deploy

**Files:**
- No code changes — operational task

**Step 1: Upload converted M4A files to Cloudflare R2**

Use the R2 dashboard or wrangler CLI to upload all `.m4a` files to the same bucket structure as the MP3s. The paths must match exactly (same directory structure, just `.m4a` extension).

**Step 2: Verify audio plays locally**

Start dev server, play a track, confirm M4A streams correctly with `audio/mp4` content-type.

**Step 3: Deploy**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel --prod
```

**Step 4: Verify all pages return 200**

```bash
for p in / /music /search /merch /events; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 5: Test audio playback on live site**

Use JAMO or HAZEL to hit mystationlive.com, play a track, verify audio streams in M4A format.

---

## Task 16: Update Service Worker Cache Version

**Files:**
- Modify: `public/sw.js` (bump cache version)

**Step 1: Bump SW cache version**

In `public/sw.js`, change:
```javascript
const CACHE_NAME = 'mystation-v5';
```
to:
```javascript
const CACHE_NAME = 'mystation-v6';
```

This forces all users to get fresh cached assets after the Phase 1 deploy.

**Step 2: Commit**

```bash
git add public/sw.js
git commit -m "chore: bump service worker cache to v6 for Phase 1 release"
```

---

## Execution Order

**Parallel Group A (UX — no dependencies):**
- Task 1: Skeleton Loader
- Task 2: Bottom Tab Bar
- Task 3: Full-Screen Now Playing
- Task 4: Loading States
- Task 5: Mobile CSS Fixes

**Parallel Group B (Audio — sequential):**
- Task 6: Convert tracks (background, ~20 min)
- Task 7: Update paths + stream API (after Task 6)
- Task 8: HQ Badge (after Task 7)

**Parallel Group C (Discovery — no dependencies):**
- Task 9: Trending API
- Task 10: Related Tracks
- Task 11: Mood Playlists
- Task 12: Trending Component

**Sequential (after all groups complete):**
- Task 13: Search Suggestions
- Task 14: Wire discovery into homepage
- Task 15: Upload M4A + Deploy
- Task 16: SW cache bump

**Total estimated tasks: 16**
**All web-side. Zero App Store resubmission.**
