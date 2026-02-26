# Subscribe & Score Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Non-subscribers get 2 free songs per album, then must subscribe (free trial) to continue. Subscribers who stay through August earn a FREE LOTL ticket.

**Architecture:** Server-side gate at `/api/audio/token` using a cookie to track album plays. Client-side gate in playerStore + TrackList + AudioPlayer for instant UX. Subscribe modal updated with LOTL ticket incentive messaging. Retention badge in Player.jsx.

**Tech Stack:** Next.js 15, Zustand, Stripe Checkout (30-day trial), cookies, existing subscribe modal

---

### Task 1: Server-Side Album Gate (Token Route)

**Files:**
- Modify: `src/app/api/audio/token/route.js`

**Context:** This is THE GATE. Currently line 117 grants all non-vault tracks for free. We add album play tracking via a `ms-album-plays` cookie. Albums with 3+ tracks are gated. Singles (`singles-2026`) are exempt.

**Step 1: Add album gate logic to token route**

Add these constants and helpers after the existing `parseCookie` function (after line 41):

```javascript
// Albums that are gated — non-subscribers get 2 free songs per album
const FREE_SONGS_PER_ALBUM = 2;
const EXEMPT_ALBUM_IDS = ['singles-2026']; // singles stay free

function getAlbumPlays(cookieStr) {
  const val = parseCookie(cookieStr, 'ms-album-plays');
  if (!val) return {};
  try { return JSON.parse(val); } catch { return {}; }
}
```

Then replace the "Open access" section (line 116-117) with album gate logic:

```javascript
    // 5. Album gate — non-subscribers get 2 free songs per album
    const albumId = track.albumId;
    if (albumId && !EXEMPT_ALBUM_IDS.includes(albumId)) {
      const albumPlays = getAlbumPlays(cookieStr);
      const played = albumPlays[albumId] || [];

      // Allow if this track was already played (replay OK) or under limit
      if (!played.includes(track.id) && played.length >= FREE_SONGS_PER_ALBUM) {
        return NextResponse.json(
          { error: 'album_limit', albumId, limit: FREE_SONGS_PER_ALBUM },
          { status: 403 }
        );
      }

      // Track this play in cookie
      if (!played.includes(track.id)) {
        played.push(track.id);
        albumPlays[albumId] = played;
      }
      const response = await grantToken(track);
      response.cookies.set('ms-album-plays', JSON.stringify(albumPlays), {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: false, // client needs to read it
        sameSite: 'lax',
      });
      return response;
    }

    // 6. Open access — singles and tracks without albumId
    return grantToken(track);
```

**Step 2: Build and verify no errors**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add "src/app/api/audio/token/route.js"
git commit -m "feat: add 2-song album gate for non-subscribers (server-side)"
```

---

### Task 2: Client-Side Album Gate (Player Store)

**Files:**
- Modify: `src/store/playerStore.js`

**Context:** Add `albumPlays` tracking to playerStore and a helper function `checkAlbumGate(track)` that both TrackList and AudioPlayer will call before playing.

**Step 1: Add album gate state and helpers to playerStore**

In the `usePlayerStore` create function, after the `pendingTrack: null` line (line 36), add:

```javascript
  // Album gate — tracks played per album for non-subscribers (session only, not persisted)
  albumPlays: {}, // { albumId: [trackId1, trackId2] }
```

After the `setShowAccountWall` method (line 90), add:

```javascript
  // Album gate helpers
  recordAlbumPlay: (track) => {
    if (!track?.albumId) return;
    set((state) => {
      const plays = { ...state.albumPlays };
      const albumTracks = plays[track.albumId] || [];
      if (!albumTracks.includes(track.id)) {
        plays[track.albumId] = [...albumTracks, track.id];
      }
      return { albumPlays: plays };
    });
  },

  // Initialize albumPlays from cookie (call on mount)
  initAlbumPlays: () => {
    if (typeof document === 'undefined') return;
    try {
      const match = document.cookie.match(/ms-album-plays=([^;]+)/);
      if (match) {
        const plays = JSON.parse(decodeURIComponent(match[1]));
        set({ albumPlays: plays });
      }
    } catch {}
  },
```

**Step 2: Add checkAlbumGate as an exported utility**

After the `useUserStore` export (after line 304), add a standalone exported function:

```javascript
// Check if a track is blocked by the album gate
// Returns true if BLOCKED, false if allowed
const FREE_SONGS_PER_ALBUM = 2;
const EXEMPT_ALBUM_IDS = ['singles-2026'];

export function isAlbumGated(track) {
  if (!track?.albumId) return false;
  if (EXEMPT_ALBUM_IDS.includes(track.albumId)) return false;

  // Check subscription status
  const cookies = typeof document !== 'undefined' ? document.cookie : '';
  if (cookies.includes('mystation-sub=')) return false;
  if (cookies.includes('mystation-friend=')) return false;

  // Check album plays
  const { albumPlays } = usePlayerStore.getState();
  const played = albumPlays[track.albumId] || [];

  // Allow replay of already-played tracks
  if (played.includes(track.id)) return false;

  // Block if at limit
  return played.length >= FREE_SONGS_PER_ALBUM;
}
```

**Step 3: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/store/playerStore.js
git commit -m "feat: add album play tracking + gate check to playerStore"
```

---

### Task 3: Gate in TrackList (Click Intercept)

**Files:**
- Modify: `src/components/TrackList.jsx`

**Context:** When a non-subscriber clicks song #3+ from a gated album, show subscribe modal instead of playing.

**Step 1: Add import and gate check to TrackList**

Add import at top (after line 11):

```javascript
import { isAlbumGated } from '@/store/playerStore';
```

Replace the `handleTrackClick` callback (lines 193-204) with:

```javascript
  const handleTrackClick = useCallback((track, index) => {
    if (track.isComingSoon) return;
    if (track.streamOnly) {
      window.open(track.spotify || track.apple, '_blank');
      return;
    }
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }
    // Album gate — check before playing
    if (isAlbumGated(track)) {
      usePlayerStore.getState().openSubscribeModal(track);
      return;
    }
    setQueue(displayTracks, index);
  }, [currentTrack?.id, togglePlay, setQueue, displayTracks]);
```

**Step 2: Build and verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`

**Step 3: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/components/TrackList.jsx
git commit -m "feat: intercept track clicks with album gate — show subscribe modal"
```

---

### Task 4: Gate in AudioPlayer (Auto-Advance Intercept)

**Files:**
- Modify: `src/components/AudioPlayer.jsx`

**Context:** When a song ends and nextTrack() would auto-advance to a gated song, pause and show subscribe modal instead.

**Step 1: Add import**

Add after the existing imports (after line 4):

```javascript
import { isAlbumGated } from '@/store/playerStore';
```

**Step 2: Add gate check in the track-loading effect**

In the `useEffect` that loads new tracks (the one starting at line 332), add a gate check after the vault check block (after line 351, before `if (playing)`):

```javascript
    // Album gate — block if non-subscriber hit album limit
    if (isAlbumGated(currentTrack)) {
      audio.pause();
      pause();
      storeActionsRef.current.openSubscribeModal(currentTrack);
      lastTrackIdRef.current = null; // allow retry after subscribing
      return;
    }
```

**Step 3: Also intercept the getAudioUrl 403 response**

In the `getAudioUrl` callback (lines 151-170), update the error handling to detect album_limit:

Replace lines 161-163:
```javascript
      if (!resp.ok) {
        return null;
      }
```

With:
```javascript
      if (!resp.ok) {
        if (resp.status === 403) {
          const data = await resp.json().catch(() => ({}));
          if (data.error === 'album_limit') {
            storeActionsRef.current.openSubscribeModal(track);
            storeActionsRef.current.pause();
          }
        }
        return null;
      }
```

Note: `storeActionsRef` is already in scope since `getAudioUrl` is inside AudioPlayer.

**Step 4: Record album plays on successful track load**

In the track-loading effect, after `incrementPlayCount(currentTrack.id)` (line 354), add:

```javascript
    usePlayerStore.getState().recordAlbumPlay(currentTrack);
```

**Step 5: Initialize albumPlays from cookie on mount**

In the initialization `useEffect` (the one starting at line 173), add at the beginning (after `if (!audio || isAudioInitialized) return;`):

```javascript
    usePlayerStore.getState().initAlbumPlays();
```

**Step 6: Build and verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`

**Step 7: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/components/AudioPlayer.jsx
git commit -m "feat: intercept auto-advance with album gate + record album plays"
```

---

### Task 5: Subscribe Modal — LOTL Ticket Messaging

**Files:**
- Modify: `src/components/SubscribeModal.jsx`

**Context:** Add LOTL ticket incentive to the subscribe modal header. Gold accent for the ticket line.

**Step 1: Update the modal header**

Replace the non-success header text (lines 174-177):

```javascript
              <>
                <h2 className="text-xl font-bold text-white mb-1">Join the MyStation Family</h2>
                <p className="text-white/60 text-sm">Pick your plan to unlock unlimited streaming.</p>
              </>
```

With:

```javascript
              <>
                <h2 className="text-xl font-bold text-white mb-1">Subscribe FREE — First Month On Us</h2>
                <div className="space-y-1 mt-2">
                  <p className="text-white/70 text-sm flex items-center justify-center gap-1.5">
                    <Check size={14} className="text-green-400 shrink-0" /> Unlock ALL 100+ tracks instantly
                  </p>
                  <p className="text-[#D4AF37] text-sm font-semibold flex items-center justify-center gap-1.5">
                    <span className="text-base">🎫</span> Stay through August → FREE LOTL ticket ($20 value)
                  </p>
                </div>
              </>
```

**Step 2: Update the subscribe button text**

Replace the subscribe button text (line 243):
```javascript
                    Subscribe — ${tiers.find(t => t.id === selectedTier)?.price}/mo
```

With:
```javascript
                    Start Free Trial — ${tiers.find(t => t.id === selectedTier)?.price}/mo after
```

**Step 3: Update the cancel text**

Replace line 247:
```javascript
              <p className="text-white/30 text-xs text-center mt-2">Cancel anytime. All proceeds support youth & community programs.</p>
```

With:
```javascript
              <p className="text-white/30 text-xs text-center mt-2">First month FREE. Cancel anytime. All proceeds support youth & community programs.</p>
```

**Step 4: Build and verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`

**Step 5: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/components/SubscribeModal.jsx
git commit -m "feat: add LOTL ticket incentive + free trial messaging to subscribe modal"
```

---

### Task 6: Retention Badge in Player

**Files:**
- Modify: `src/components/Player.jsx`

**Context:** Small gold badge for subscribers showing progress toward free LOTL ticket. Shows below the mini player on mobile, in the expanded view on desktop.

**Step 1: Find the mobile mini player section in Player.jsx**

Search for the mobile mini player return. It's the section with `z-[9999]` that renders when `currentTrack` exists but `expanded` is false. Add a LOTL badge component above the Player export.

Add this component BEFORE the `export default function Player()` line (before line 87):

```javascript
function LOTLBadge() {
  const [show, setShow] = useState(false);
  const [months, setMonths] = useState(0);

  useEffect(() => {
    // Check if subscriber via cookie
    const isSub = document.cookie.includes('mystation-sub=');
    if (!isSub) { setShow(false); return; }

    // Calculate months until August 2026
    const now = new Date();
    const target = new Date(2026, 7, 31); // Aug 31, 2026
    if (now > target) {
      setMonths(-1); // Past deadline — show earned message
    } else {
      const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
      setMonths(diff);
    }
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="px-3 py-1.5 bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border-t border-[#D4AF37]/20">
      <p className="text-[11px] text-[#D4AF37] text-center font-medium truncate">
        {months < 0
          ? '🎫 You earned a FREE LOTL ticket! Check your email.'
          : `🎫 ${months} month${months !== 1 ? 's' : ''} to your FREE LOTL ticket!`
        }
      </p>
    </div>
  );
}
```

**Step 2: Render LOTLBadge in the mini player**

Find where the mini player renders (the mobile view with track info + controls). The LOTLBadge should go right after the mini player's control row, INSIDE the z-[9999] container but below the main content.

Search for the mini player's closing wrapper and add `<LOTLBadge />` just before it closes. The exact location depends on the Player.jsx structure — add it after the mobile mini player controls row, before the container closes.

**Step 3: Build and verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`

**Step 4: Commit**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
git add src/components/Player.jsx
git commit -m "feat: add LOTL ticket retention badge to player"
```

---

### Task 7: Deploy & Verify

**Step 1: Final build check**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -10`
Expected: Build succeeds, 0 errors

**Step 2: Deploy**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
vercel --prod
```

**Step 3: Verify all pages return 200**

```bash
for p in / /music /search /merch; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 4: Test the album gate**

Use JAMO browser to:
1. Clear cookies on mystationlive.com
2. Go to /music, play a track from IDMG Mixtape
3. Play a second track — should work
4. Try to play a third track — should show subscribe modal
5. Verify singles still play freely (no limit)

**Step 5: Test subscribe flow**

1. Click subscribe in the modal
2. Verify LOTL ticket messaging is visible
3. Verify "Start Free Trial" button text
4. Verify Stripe checkout loads

---

## Files Modified (Summary)

| File | Change |
|------|--------|
| `src/app/api/audio/token/route.js` | Album gate + cookie tracking |
| `src/store/playerStore.js` | albumPlays state + isAlbumGated() |
| `src/components/TrackList.jsx` | Click intercept |
| `src/components/AudioPlayer.jsx` | Auto-advance intercept + play recording |
| `src/components/SubscribeModal.jsx` | LOTL ticket messaging |
| `src/components/Player.jsx` | Retention badge |
