# MyStationRadio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `/mystationradio` — a 24/7 radio tab with artist search, smart-mix (80% artist / 20% other creators) auto-advancing queue, shared-link auto-play, and new Navbar + BottomTabBar entry points.

**Architecture:** Client-heavy Next.js App Router page. New Zustand `radioStore` holds station + queue metadata; existing `playerStore` + `AudioPlayer.jsx` singleton handles the actual audio. Catalog merges static Mike Page tracks (`src/data/tracks.js`) with Supabase `creator_tracks`. Queue auto-refills when nearly empty. Global shared-link auto-play system is gated to skip this route so only the radio's own auto-play fires.

**Tech Stack:** Next.js 15 (App Router), React 19, Zustand, Tailwind CSS 4, Supabase (`getSupabaseAdmin` from `@/lib/creatorAuth`), lucide-react, Vercel.

**Design doc:** `docs/plans/2026-04-14-mystationradio-design.md`

---

## Task 0: Read context and verify state

**Files to read:**
- `src/store/playerStore.js` — understand `setTrack`, `setQueue`, `togglePlay`, `onEnded` hooks
- `src/components/AudioPlayer.jsx` — see module-level `globalAudio` singleton + onEnded listener
- `src/data/tracks.js` — static Mike Page track shape
- `src/app/api/creators/[slug]/route.js` — supabase `creator_tracks` schema reference
- `src/components/Navbar.jsx` — find nav link pattern
- `src/components/BottomTabBar.jsx` — find tab slot pattern
- `docs/plans/2026-04-14-mystationradio-design.md` — full design

**Step 1:** Confirm `creator_tracks` schema has: `id, title, artist, album, producer, duration, audio_url, cover_url, creator_id, status`.

**Step 2:** Confirm `playerStore.setTrack` sets `isPlaying: true` and `playerStore.setQueue(tracks, 0)` both exist and work.

**Step 3:** Grep for where the global shared-link `?shared=true` auto-play listener lives:
```
grep -rn "shared=true\|sharedTrackId\|clearSharedTrack" src/components src/app
```
Expected: find the onload listener in AudioPlayer.jsx or layout.jsx. Document the file:line.

**Step 4:** No commit — context-only.

---

## Task 1: Create `radioStore.js`

**Files:**
- Create: `src/store/radioStore.js`

**Step 1: Write the store**

```javascript
/**
 * MYSTATION RADIO — Station + queue state
 * Pairs with playerStore (audio engine) to power the /mystationradio tab.
 */
import { create } from 'zustand';
import { usePlayerStore } from './playerStore';

export const useRadioStore = create((set, get) => ({
  activeStation: null, // { slug, name, avatar }
  queue: [],           // Track[] pre-shuffled
  cursor: 0,
  isRadioActive: false,
  history: [],         // last 20 played
  refilling: false,

  startStation: async (station) => {
    const res = await fetch(`/api/mystationradio/station?artist=${encodeURIComponent(station.slug)}`);
    if (!res.ok) return;
    const { queue } = await res.json();
    if (!queue?.length) return;
    set({ activeStation: station, queue, cursor: 0, isRadioActive: true, history: [] });
    usePlayerStore.getState().setTrack(queue[0]);
  },

  advance: () => {
    const { queue, cursor, isRadioActive, history } = get();
    if (!isRadioActive || !queue.length) return;
    const nextIdx = cursor + 1;
    if (nextIdx >= queue.length) return;
    const nextTrack = queue[nextIdx];
    const prevTrack = queue[cursor];
    set({
      cursor: nextIdx,
      history: prevTrack ? [prevTrack, ...history].slice(0, 20) : history,
    });
    usePlayerStore.getState().setTrack(nextTrack);
    // Background refill when running low
    if (queue.length - nextIdx < 20) get().refillQueue();
  },

  skip: () => get().advance(),

  stop: () => {
    set({ activeStation: null, queue: [], cursor: 0, isRadioActive: false, history: [] });
    usePlayerStore.getState().pause();
  },

  refillQueue: async () => {
    const { activeStation, queue, refilling } = get();
    if (!activeStation || refilling) return;
    set({ refilling: true });
    try {
      const res = await fetch(`/api/mystationradio/station?artist=${encodeURIComponent(activeStation.slug)}&offset=${Date.now()}`);
      if (res.ok) {
        const { queue: more } = await res.json();
        if (more?.length) set({ queue: [...queue, ...more] });
      }
    } finally {
      set({ refilling: false });
    }
  },
}));
```

**Step 2: Commit**

```bash
git add src/store/radioStore.js
git commit -m "feat(radio): add radioStore with station/queue state"
```

---

## Task 2: Catalog API

**Files:**
- Create: `src/app/api/mystationradio/catalog/route.js`

**Step 1: Write the route**

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min

export async function GET() {
  const supabase = getSupabaseAdmin();

  // Fetch all active creators + their track counts
  const { data: creators } = await supabase
    .from('creators')
    .select('slug, display_name, avatar_url, track_count')
    .eq('subscription_status', 'active')
    .gt('track_count', 0)
    .order('track_count', { ascending: false });

  const artists = [
    {
      slug: 'mike-page',
      name: 'Mike Page',
      avatar: '/images/idmg-logo-white.png',
      trackCount: mikePageTracks.length,
    },
    ...(creators || []).map((c) => ({
      slug: c.slug,
      name: c.display_name,
      avatar: c.avatar_url,
      trackCount: c.track_count || 0,
    })),
  ];

  return NextResponse.json({
    artists,
    totalTracks: artists.reduce((sum, a) => sum + a.trackCount, 0),
  });
}
```

**Step 2: Smoke test**

```bash
curl -s http://localhost:3000/api/mystationradio/catalog | head -20
```
Expected: JSON with `artists` array including `mike-page`.

**Step 3: Commit**

```bash
git add src/app/api/mystationradio/catalog/route.js
git commit -m "feat(radio): catalog API merges static + supabase creators"
```

---

## Task 3: Search API

**Files:**
- Create: `src/app/api/mystationradio/search/route.js`

**Step 1: Write the route**

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ results: [] });

  const supabase = getSupabaseAdmin();
  const { data: creators } = await supabase
    .from('creators')
    .select('slug, display_name, avatar_url, track_count')
    .ilike('display_name', `%${q}%`)
    .eq('subscription_status', 'active')
    .limit(10);

  const results = (creators || []).map((c) => ({
    slug: c.slug,
    name: c.display_name,
    avatar: c.avatar_url,
    trackCount: c.track_count || 0,
  }));

  // Always include Mike Page if query matches
  if ('mike page'.includes(q.toLowerCase()) || 'idmg'.includes(q.toLowerCase())) {
    results.unshift({
      slug: 'mike-page',
      name: 'Mike Page',
      avatar: '/images/idmg-logo-white.png',
      trackCount: mikePageTracks.length,
    });
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
```

**Step 2: Smoke test**

```bash
curl -s 'http://localhost:3000/api/mystationradio/search?q=mike' | head -20
```
Expected: JSON with `results[0].slug === 'mike-page'`.

**Step 3: Commit**

```bash
git add src/app/api/mystationradio/search/route.js
git commit -m "feat(radio): artist search API"
```

---

## Task 4: Station queue builder API

**Files:**
- Create: `src/app/api/mystationradio/station/route.js`

**Step 1: Write the route**

```javascript
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/creatorAuth';
import { tracks as mikePageTracks } from '@/data/tracks';

export const dynamic = 'force-dynamic';

const QUEUE_SIZE = 200;
const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/';

function normalizeMikePageTrack(t) {
  const audioFile = t.audioFile?.startsWith('http')
    ? t.audioFile
    : `${R2_BASE}${(t.audioFile || '').replace(/^\/audio\//, '')}`;
  return {
    id: `mp-${t.id}`,
    title: t.title,
    artist: t.artist || 'Mike Page',
    album: t.album || 'Mike Page',
    duration: t.duration || null,
    audioFile,
    coverArt: '/images/albums/idmg-mixtape-cover.png',
    stationArtist: 'mike-page',
  };
}

function normalizeCreatorTrack(t, creator) {
  return {
    id: `cr-${t.id}`,
    title: t.title,
    artist: t.artist || creator.display_name,
    album: t.album || '',
    duration: t.duration || null,
    audioFile: t.audio_url,
    coverArt: t.cover_url || creator.avatar_url || '/images/idmg-logo-white.png',
    stationArtist: creator.slug,
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getAllCreatorTracksExcept(supabase, excludeSlug) {
  const { data: creators } = await supabase
    .from('creators')
    .select('id, slug, display_name, avatar_url')
    .eq('subscription_status', 'active')
    .neq('slug', excludeSlug);
  if (!creators?.length) return [];
  const creatorMap = new Map(creators.map((c) => [c.id, c]));
  const ids = creators.map((c) => c.id);
  const { data: rows } = await supabase
    .from('creator_tracks')
    .select('id, title, artist, album, duration, audio_url, cover_url, creator_id')
    .in('creator_id', ids)
    .eq('status', 'active')
    .not('audio_url', 'is', null);
  return (rows || []).map((t) => normalizeCreatorTrack(t, creatorMap.get(t.creator_id)));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('artist') || 'mike-page';
  const supabase = getSupabaseAdmin();

  // Primary track pool
  let primaryPool = [];
  if (slug === 'mike-page') {
    primaryPool = mikePageTracks
      .filter((t) => t.audioFile)
      .map(normalizeMikePageTrack);
  } else {
    const { data: creator } = await supabase
      .from('creators')
      .select('id, slug, display_name, avatar_url')
      .eq('slug', slug)
      .eq('subscription_status', 'active')
      .maybeSingle();
    if (creator) {
      const { data: rows } = await supabase
        .from('creator_tracks')
        .select('id, title, artist, album, duration, audio_url, cover_url, creator_id')
        .eq('creator_id', creator.id)
        .eq('status', 'active')
        .not('audio_url', 'is', null);
      primaryPool = (rows || []).map((t) => normalizeCreatorTrack(t, creator));
    }
  }

  if (primaryPool.length === 0) {
    return NextResponse.json({ queue: [], error: 'No tracks for station' }, { status: 404 });
  }

  // Other creators pool (for smart mix)
  const otherPool = await getAllCreatorTracksExcept(supabase, slug);
  // Also mix mike-page into non-mike-page stations
  if (slug !== 'mike-page') {
    otherPool.push(...mikePageTracks.filter((t) => t.audioFile).map(normalizeMikePageTrack));
  }

  // Smart mix ratio: 80/20 default, 60/40 if primary < 10 tracks
  const ratio = primaryPool.length < 10 ? 0.6 : 0.8;
  const primaryCount = Math.round(QUEUE_SIZE * ratio);
  const otherCount = QUEUE_SIZE - primaryCount;

  // Fill with shuffled picks (cycle pools to avoid duplicates until forced)
  const queue = [];
  const primary = shuffle(primaryPool);
  const other = shuffle(otherPool);
  let pi = 0;
  let oi = 0;
  for (let i = 0; i < QUEUE_SIZE; i++) {
    const isPrimary = (i % 5) < Math.round(ratio * 5); // 4 of every 5 = primary at 80%
    if (isPrimary && primary.length) {
      queue.push(primary[pi % primary.length]);
      pi++;
    } else if (other.length) {
      queue.push(other[oi % other.length]);
      oi++;
    } else if (primary.length) {
      queue.push(primary[pi % primary.length]);
      pi++;
    }
  }

  return NextResponse.json({
    station: { slug, name: slug === 'mike-page' ? 'Mike Page' : slug },
    queue: shuffle(queue).slice(0, QUEUE_SIZE),
    primaryCount,
    otherCount,
  });
}
```

**Step 2: Smoke test**

```bash
curl -s 'http://localhost:3000/api/mystationradio/station?artist=mike-page' | python3 -c "import json,sys; d=json.load(sys.stdin); print('queue_len', len(d.get('queue',[]))); print('first', d.get('queue',[{}])[0].get('title'))"
```
Expected: `queue_len 200` and a real track title.

**Step 3: Commit**

```bash
git add src/app/api/mystationradio/station/route.js
git commit -m "feat(radio): station queue builder with 80/20 smart mix"
```

---

## Task 5: OG image route

**Files:**
- Create: `src/app/api/og/mystationradio/route.jsx`

**Step 1: Write the route**

```jsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get('station') || 'Mike Page';
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg,#0a0a0a 0%,#1a0f05 50%,#0a0a0a 100%)',
          color: '#FFD700',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: 8, marginBottom: 20 }}>MYSTATION</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: '#FFD700', textAlign: 'center' }}>
          {station.toUpperCase()}
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', marginTop: 10 }}>RADIO</div>
        <div style={{ fontSize: 28, color: '#fff', opacity: 0.7, marginTop: 40 }}>
          24/7 · Every artist. Every track.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**Step 2: Smoke test locally after build**

Visit `http://localhost:3000/api/og/mystationradio?station=Mike+Page` and confirm PNG renders.

**Step 3: Commit**

```bash
git add src/app/api/og/mystationradio/route.jsx
git commit -m "feat(radio): OG image route"
```

---

## Task 6: `RadioStationTile.jsx` component

**Files:**
- Create: `src/components/RadioStationTile.jsx`

**Step 1: Write**

```jsx
'use client';
import Image from 'next/image';
import { Play } from 'lucide-react';

export default function RadioStationTile({ station, active, onPlay }) {
  return (
    <button
      onClick={() => onPlay(station)}
      className={`group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all min-w-[130px] ${
        active
          ? 'bg-[#FFD700]/10 border border-[#FFD700]/40'
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-black/40">
        {station.avatar && (
          <Image
            src={station.avatar}
            alt={station.name}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-10 h-10 fill-white text-white" />
        </div>
      </div>
      <div className="text-sm font-bold text-white text-center truncate max-w-[110px]">
        {station.name}
      </div>
      <div className="text-xs text-white/50">{station.trackCount} tracks</div>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/RadioStationTile.jsx
git commit -m "feat(radio): RadioStationTile component"
```

---

## Task 7: `RadioNowPlaying.jsx` component

**Files:**
- Create: `src/components/RadioNowPlaying.jsx`

**Step 1: Write**

```jsx
'use client';
import { Play, Pause, SkipForward, Square, Radio } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useRadioStore } from '@/store/radioStore';

export default function RadioNowPlaying() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { activeStation, isRadioActive, skip, stop, queue, cursor } = useRadioStore();

  if (!isRadioActive || !currentTrack) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <Radio className="w-12 h-12 mx-auto mb-3 text-white/40" />
        <div className="text-white/60">Pick a station to start the radio.</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#FFD700]/30 bg-gradient-to-br from-[#1a1410] via-[#2a1a05] to-[#1a1410] shadow-[0_0_60px_rgba(255,215,0,0.15)] p-6">
      <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
        <Radio className="w-4 h-4" /> Now Playing · {activeStation?.name} Radio
      </div>
      <div className="text-3xl md:text-4xl font-black text-white truncate">{currentTrack.title}</div>
      <div className="text-white/60 truncate mb-6">{currentTrack.artist}</div>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] shadow-[0_0_40px_rgba(255,215,0,0.5)]"
        >
          {isPlaying ? <Pause className="w-9 h-9 fill-black text-black" /> : <Play className="w-9 h-9 fill-black text-black ml-1" />}
        </button>
        <button
          onClick={skip}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <SkipForward className="w-7 h-7" />
        </button>
        <button
          onClick={stop}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
          aria-label="Stop station"
        >
          <Square className="w-6 h-6 fill-red-400" />
        </button>
      </div>
      <div className="text-xs text-white/40 mt-4">Track {cursor + 1} of {queue.length} in queue</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/RadioNowPlaying.jsx
git commit -m "feat(radio): RadioNowPlaying component with play/skip/stop"
```

---

## Task 8: `MyStationRadioClient.jsx` main page

**Files:**
- Create: `src/app/mystationradio/MyStationRadioClient.jsx`

**Step 1: Write**

```jsx
'use client';
import { useEffect, useState } from 'react';
import { Radio, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRadioStore } from '@/store/radioStore';
import { usePlayerStore } from '@/store/playerStore';
import RadioNowPlaying from '@/components/RadioNowPlaying';
import RadioStationTile from '@/components/RadioStationTile';

export default function MyStationRadioClient() {
  const searchParams = useSearchParams();
  const urlStation = searchParams.get('station');
  const { startStation, activeStation, queue, cursor, isRadioActive } = useRadioStore();
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Load catalog
  useEffect(() => {
    fetch('/api/mystationradio/catalog')
      .then((r) => r.json())
      .then((d) => setCatalog(d.artists || []))
      .catch(() => {});
  }, []);

  // URL-based auto-play (shared links)
  useEffect(() => {
    if (bootstrapped) return;
    if (catalog.length === 0) return;
    const slug = urlStation || 'mike-page';
    const station = catalog.find((s) => s.slug === slug) || catalog.find((s) => s.slug === 'mike-page');
    if (station && !isRadioActive) {
      startStation(station);
    }
    setBootstrapped(true);
  }, [catalog, urlStation, isRadioActive, startStation, bootstrapped]);

  // Live search
  useEffect(() => {
    if (!q.trim()) return setResults([]);
    const ctl = new AbortController();
    fetch(`/api/mystationradio/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => {});
    return () => ctl.abort();
  }, [q]);

  const upcoming = queue.slice(cursor + 1, cursor + 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0a1c] to-[#0a0a0a] text-white pb-32">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
          <Radio className="w-4 h-4" /> MyStation Radio
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
          <span className="bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] bg-clip-text text-transparent">
            24/7
          </span>
        </h1>
        <p className="text-xl text-white/70 mb-8">Every artist. Every track. Non-stop.</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artist..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700]/40"
          />
          {results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#0f0a1c] border border-white/10 rounded-2xl overflow-hidden z-10 shadow-2xl">
              {results.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => { startStation(r); setQ(''); setResults([]); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{r.name}</div>
                    <div className="text-xs text-white/50">{r.trackCount} tracks</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Now Playing */}
        <div className="mb-8">
          <RadioNowPlaying />
        </div>

        {/* Featured Stations */}
        <div className="mb-8">
          <div className="text-xs font-bold tracking-[2px] uppercase text-white/50 mb-3">Featured Stations</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {catalog.slice(0, 12).map((s) => (
              <RadioStationTile
                key={s.slug}
                station={s}
                active={activeStation?.slug === s.slug}
                onPlay={startStation}
              />
            ))}
          </div>
        </div>

        {/* Coming Up */}
        {upcoming.length > 0 && (
          <div>
            <div className="text-xs font-bold tracking-[2px] uppercase text-white/50 mb-3">Coming Up Next</div>
            <div className="space-y-2">
              {upcoming.map((t, i) => (
                <div key={`${t.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[#FFD700]/50 font-bold text-sm tabular-nums w-6">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">{t.title}</div>
                    <div className="text-xs text-white/50 truncate">{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/mystationradio/MyStationRadioClient.jsx
git commit -m "feat(radio): main client page with search, now-playing, stations, queue"
```

---

## Task 9: `page.jsx` server wrapper + metadata

**Files:**
- Create: `src/app/mystationradio/page.jsx`

**Step 1: Write**

```jsx
import { Suspense } from 'react';
import MyStationRadioClient from './MyStationRadioClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const station = params?.station || 'mike-page';
  const name = station.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const url = `https://mystationlive.com/mystationradio${station !== 'mike-page' ? `?station=${station}` : ''}`;
  const ogImage = `https://mystationlive.com/api/og/mystationradio?station=${encodeURIComponent(name)}`;
  return {
    metadataBase: new URL('https://mystationlive.com'),
    title: `${name} Radio · 24/7 on MyStation`,
    description: `${name} Radio — 24/7 nonstop mix. Every artist. Every track.`,
    openGraph: {
      title: `${name} Radio · 24/7 on MyStation`,
      description: `Nonstop mix on MyStation Radio. Smart-mixed. Always on.`,
      url,
      siteName: 'MyStation',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} Radio` }],
      // og:audio intentionally omitted to avoid iMessage duplicate play button
    },
    twitter: { card: 'summary_large_image', title: `${name} Radio`, images: [ogImage] },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MyStationRadioClient />
    </Suspense>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/mystationradio/page.jsx
git commit -m "feat(radio): server page with metadata (no og:audio)"
```

---

## Task 10: Auto-advance wiring in `AudioPlayer.jsx`

**Goal:** When the audio `onEnded` fires AND `radioStore.isRadioActive` is true, call `radioStore.advance()` so the next track plays.

**Files:**
- Modify: `src/components/AudioPlayer.jsx` (find the `ended` event handler)

**Step 1:** Read `src/components/AudioPlayer.jsx` and find the `audio.addEventListener('ended', ...)` or the onEnded equivalent. Document the line number.

**Step 2:** Import `useRadioStore` at top:
```javascript
import { useRadioStore } from '@/store/radioStore';
```

**Step 3:** Inside the `ended` handler, BEFORE any existing "play next in playerStore queue" logic, add:
```javascript
const radio = useRadioStore.getState();
if (radio.isRadioActive) {
  radio.advance();
  return;
}
```

**Step 4:** Smoke test: start radio locally, let a short track end, verify next track loads automatically.

**Step 5: Commit**

```bash
git add src/components/AudioPlayer.jsx
git commit -m "feat(radio): auto-advance queue on track end when radio active"
```

---

## Task 11: Gate global shared-link auto-play on `/mystationradio`

**Goal:** The existing global shared-link auto-play (triggered by `?shared=true` or similar) must NOT fire on `/mystationradio` — the radio's own URL-driven auto-play is the only auto-play that runs there.

**Files:**
- Modify: wherever global shared-link auto-play lives (found in Task 0 Step 3 — likely `src/components/AudioPlayer.jsx` or a `ClientProviders` wrapper)

**Step 1:** Add a guard at the top of the listener effect:
```javascript
if (typeof window !== 'undefined' && window.location.pathname === '/mystationradio') {
  return;
}
```

If the effect uses `usePathname`:
```javascript
const pathname = usePathname();
useEffect(() => {
  if (pathname === '/mystationradio') return;
  // existing logic
}, [pathname, ...]);
```

**Step 2:** Verify on other routes shared-link auto-play still works (open a shared-link URL on `/song/500?shared=true`, confirm behavior unchanged).

**Step 3: Commit**

```bash
git add <file>
git commit -m "feat(radio): disable global shared-link auto-play on /mystationradio"
```

---

## Task 12: Navbar "Radio" link

**Files:**
- Modify: `src/components/Navbar.jsx`

**Step 1:** Read Navbar.jsx, find where existing nav links are declared (likely an array of `{label, href, icon}`).

**Step 2:** Add new entry near top:
```javascript
{ label: 'Radio', href: '/mystationradio', icon: Radio }
```
Import `Radio` from `lucide-react` if not already imported.

**Step 3: Commit**

```bash
git add src/components/Navbar.jsx
git commit -m "feat(radio): add Navbar Radio link"
```

---

## Task 13: BottomTabBar 6th "Radio" tab

**Files:**
- Modify: `src/components/BottomTabBar.jsx`

**Step 1:** Read BottomTabBar.jsx. Find the tabs array.

**Step 2:** Add a new tab entry for Radio with the `Radio` icon from lucide-react. Place it where it fits the nav flow (recommend between Search and Shop).

**Step 3:** If the bar uses a fixed grid (e.g. `grid-cols-5`), change to `grid-cols-6` to accommodate.

**Step 4:** Verify mobile viewport: all 6 tabs visible, no overflow, icons + labels legible at 390px width.

**Step 5: Commit**

```bash
git add src/components/BottomTabBar.jsx
git commit -m "feat(radio): add 6th BottomTabBar tab for Radio"
```

---

## Task 14: Local smoke test

**Step 1:** Run the dev server:
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npm run dev
```

**Step 2:** In browser, visit `http://localhost:3000/mystationradio`. Verify:
- Page renders with search, now-playing card, featured stations
- Mike Page Radio auto-starts (first track loads + plays)
- Click SKIP → next track loads
- Let one track play to end → auto-advances
- Click STOP → audio stops, now-playing card resets to "Pick a station"
- Click a different station tile → queue swaps, new track plays
- Search "mike" → dropdown shows Mike Page → click → station starts
- Navigate away to `/music`, audio keeps playing
- Navigate back to `/mystationradio`, same station still showing

**Step 3:** Visit `http://localhost:3000/mystationradio?station=mike-page` directly → verify auto-play fires.

**Step 4:** Visit `http://localhost:3000/song/500?shared=true` (existing shared link) → verify the old shared-link auto-play still works there (not affected by Task 11 gate).

**Step 5:** No commit — verification only.

---

## Task 15: Deploy to production

**Step 1:** Verify no in-flight builds:
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel ls 2>&1 | grep -E "Building|Queued"
```
Expected: empty output.

**Step 2:** Deploy:
```bash
vercel --prod 2>&1 | tail -20
```

**Step 3:** Wait for `● Ready` status. Check with `vercel ls | head -3`.

**Step 4:** Verify live:
```bash
for p in / /music /quickplay /mystationradio "/mystationradio?station=mike-page"; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' "https://mystationlive.com$p")"
done
```
Expected: all 200.

**Step 5:** Pull `/mystationradio` in browser on iPhone or simulator. Verify auto-play fires, skip/stop/switch stations all work on live.

**Step 6:** Commit the deploy marker:
```bash
git log --oneline | head -5
```

---

## Rollback plan

If anything breaks on prod:
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel ls | head -5   # find previous deploy
vercel promote <previous-url>
```

---

## Done criteria

- [ ] `/mystationradio` 200 on prod
- [ ] `?station=mike-page` auto-plays on load
- [ ] Global shared-link auto-play still works on `/song/:id?shared=true`
- [ ] Skip / Stop / Switch station all work
- [ ] Queue auto-refills after 180 tracks
- [ ] Navbar Radio link visible
- [ ] BottomTabBar 6th tab visible on mobile
- [ ] No console errors on live
- [ ] 80/20 smart mix verified (inspect queue for ~40 non-primary tracks per 200)
