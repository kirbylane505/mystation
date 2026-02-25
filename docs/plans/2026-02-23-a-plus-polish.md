# MyStation A+ Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the 5 critical UX/polish issues that stand between MyStation and A+ quality.

**Architecture:** Surgical CSS and component fixes — no new libraries, no architectural changes. Fix globals.css animation kills, add loading skeletons per route, increase touch targets via padding, add lightweight page transitions, and rationalize z-index/spacing.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS, React, CSS custom properties

---

### Task 1: Restore skeleton pulse animations

**Files:**
- Modify: `src/styles/globals.css:5-11` (first animate-pulse kill)
- Modify: `src/styles/globals.css:504-516` (second animate-pulse kill + dead keyframes)
- Modify: `src/styles/globals.css:177-179` (donation-highlight dead animation)

**Context:** `animate-pulse` was globally killed with `animation: none !important` in TWO places (lines 5-11 inside `@layer utilities` and lines 504-511 at top level). This broke ALL skeleton loading states site-wide (homepage merch, music page, merch page) and the player's "now playing" indicator bars. The original intent was to stop blinking on track items, but it nuked everything.

**Step 1: Remove the first animate-pulse kill block**

In `src/styles/globals.css`, replace lines 5-11:

```css
/* PERMANENT: Override Tailwind animate-pulse at utility layer — NO BLINKING EVER */
@layer utilities {
  .animate-pulse {
    animation: none !important;
    opacity: 1 !important;
  }
}
```

With nothing (delete entirely).

**Step 2: Remove the second animate-pulse kill block and fix pulse keyframes**

In `src/styles/globals.css`, replace lines 504-516:

```css
/* PERMANENT: Kill ALL blinking/pulsing site-wide — NO EXCEPTIONS */
.animate-pulse,
[class*="animate-pulse"],
[class*="glow-pulse"],
[class*="pulse-blue"] {
  animation: none !important;
  opacity: 1 !important;
}

@keyframes pulse {
  /* Killed permanently — no blinking on this site */
  0%, 50%, 100% { opacity: 1; }
}
```

With:

```css
/* Restore pulse for skeleton loaders.
   If a specific element blinks annoyingly, kill it on THAT element only. */
```

**Step 3: Replace player "now playing" bars with a proper animation**

The player bars at `Player.jsx:221-224` and `Player.jsx:466-469` use `animate-pulse` which was originally a hack — pulse just fades opacity, it doesn't make bars bounce. Replace with a proper visualizer animation.

In `src/styles/globals.css`, add after the `.animate-bounce` block (~line 502):

```css
/* Player "now playing" visualizer bars */
@keyframes visualizer-bounce {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

.now-playing-bar {
  animation: visualizer-bounce 0.8s ease-in-out infinite;
  transform-origin: bottom;
}
```

Then in `src/components/Player.jsx`, replace the expanded player bars (lines 221-224):

```jsx
<span className="w-[3px] h-4 bg-blue-400 rounded-full animate-pulse" />
<span className="w-[3px] h-6 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
<span className="w-[3px] h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
<span className="w-[3px] h-5 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
```

With:

```jsx
<span className="w-[3px] h-4 bg-blue-400 rounded-full now-playing-bar" />
<span className="w-[3px] h-6 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '150ms' }} />
<span className="w-[3px] h-3 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '300ms' }} />
<span className="w-[3px] h-5 bg-cyan-400 rounded-full now-playing-bar" style={{ animationDelay: '100ms' }} />
```

And the desktop mini player bars (lines 466-468):

```jsx
<span className="w-[2px] h-2.5 bg-blue-400 rounded-full animate-pulse" />
<span className="w-[2px] h-3.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
<span className="w-[2px] h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
```

With:

```jsx
<span className="w-[2px] h-2.5 bg-blue-400 rounded-full now-playing-bar" />
<span className="w-[2px] h-3.5 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '150ms' }} />
<span className="w-[2px] h-2 bg-blue-400 rounded-full now-playing-bar" style={{ animationDelay: '300ms' }} />
```

**Step 4: Verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

Visual check: Loading skeletons on `/`, `/music`, `/merch` should now pulse. Player bars should bounce.

**Step 5: Commit**

```bash
git add src/styles/globals.css src/components/Player.jsx
git commit -m "fix: restore skeleton pulse animations + proper player visualizer bars"
```

---

### Task 2: Add loading.jsx to all major routes

**Files:**
- Create: `src/app/events/loading.jsx`
- Create: `src/app/search/loading.jsx`
- Create: `src/app/lounge/loading.jsx`
- Create: `src/app/videos/loading.jsx`
- Create: `src/app/fan-zone/loading.jsx`

**Context:** Only `/`, `/music`, `/merch` have loading skeletons. All other routes flash blank during navigation. Each loading.jsx should match that route's layout structure. Use the existing patterns from `src/app/loading.jsx` and `src/app/music/loading.jsx` as reference.

**Step 1: Create events loading skeleton**

Create `src/app/events/loading.jsx`:

```jsx
export default function EventsLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero skeleton */}
        <div className="h-72 bg-white/5 rounded-3xl animate-pulse mb-8" />

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-white/10 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Event cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-white/10 rounded-2xl mb-3" />
              <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create search loading skeleton**

Create `src/app/search/loading.jsx`:

```jsx
export default function SearchLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Search bar skeleton */}
        <div className="h-14 bg-white/10 rounded-2xl animate-pulse mb-8" />

        {/* Trending chips */}
        <div className="flex flex-wrap gap-2 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Result placeholders */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-white/10 rounded mb-1" />
                <div className="h-3 w-1/5 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create lounge loading skeleton**

Create `src/app/lounge/loading.jsx`:

```jsx
export default function LoungeLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-8 w-56 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded animate-pulse mx-auto" />
        </div>

        {/* Game selector */}
        <div className="flex gap-4 justify-center mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-20 h-20 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Room grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create videos loading skeleton**

Create `src/app/videos/loading.jsx`:

```jsx
export default function VideosLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-white/10 rounded-2xl mb-3" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Create fan-zone loading skeleton**

Create `src/app/fan-zone/loading.jsx`:

```jsx
export default function FanZoneLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mx-auto" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Activity feed */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 6: Verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds. All new loading.jsx files are picked up by Next.js App Router.

**Step 7: Commit**

```bash
git add src/app/events/loading.jsx src/app/search/loading.jsx src/app/lounge/loading.jsx src/app/videos/loading.jsx src/app/fan-zone/loading.jsx
git commit -m "feat: add loading skeletons for events, search, lounge, videos, fan-zone"
```

---

### Task 3: Fix mobile touch targets

**Files:**
- Modify: `src/components/TrackList.jsx:45-59` (heart, reactions, comment buttons)
- Modify: `src/components/Navbar.jsx:372` (mobile hamburger)
- Modify: `src/app/search/page.jsx` (clear button, playlist button, Spotify link)

**Context:** Apple HIG and WCAG require 44x44px minimum touch targets. Multiple interactive elements are 16-32px — too small for comfortable mobile tapping.

**Step 1: Fix TrackList mobile touch targets**

In `src/components/TrackList.jsx`, replace the mobile action buttons (lines 45-60):

```jsx
        <div className="flex items-center gap-1.5 shrink-0">
          <div onClick={(e) => e.stopPropagation()}>
            <TrackHeart itemId={`track-${track.id}`} size={16} />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <SongReactions trackId={track.id} size="xs" />
          </div>
          {showComments && (
            <button
              onClick={(e) => { e.stopPropagation(); onCommentClick(track); }}
              className="p-1.5 text-white/40 hover:text-blue-400 transition"
            >
              <MessageCircle size={16} />
            </button>
          )}
        </div>
```

With:

```jsx
        <div className="flex items-center gap-0.5 shrink-0">
          <div className="p-2.5 -m-1" onClick={(e) => e.stopPropagation()}>
            <TrackHeart itemId={`track-${track.id}`} size={16} />
          </div>
          <div className="p-2.5 -m-1" onClick={(e) => e.stopPropagation()}>
            <SongReactions trackId={track.id} size="xs" />
          </div>
          {showComments && (
            <button
              onClick={(e) => { e.stopPropagation(); onCommentClick(track); }}
              className="p-3 -m-1 text-white/40 hover:text-blue-400 transition"
            >
              <MessageCircle size={16} />
            </button>
          )}
        </div>
```

This makes each button's tappable area ~44px (16px icon + 20px padding) while keeping visual density tight with negative margins.

**Step 2: Fix Navbar hamburger touch target**

In `src/components/Navbar.jsx`, replace line 372:

```jsx
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
```

With:

```jsx
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center"
```

`w-11 h-11` = 44x44px.

**Step 3: Fix search page touch targets**

In `src/app/search/page.jsx`, find the clear search button (the `w-8 h-8` element with the X icon near the search input) and change:

```jsx
className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
```

To:

```jsx
className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 rounded-full flex items-center justify-center"
```

Find the "Add to playlist" and "Spotify external" buttons (`w-8 h-8 sm:w-9 sm:h-9`) and change to `w-11 h-11`.

**Step 4: Verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

Visual check: On mobile, heart/reaction/comment buttons should be comfortably tappable without accidental triggers.

**Step 5: Commit**

```bash
git add src/components/TrackList.jsx src/components/Navbar.jsx src/app/search/page.jsx
git commit -m "fix: increase mobile touch targets to 44px minimum (WCAG compliance)"
```

---

### Task 4: Add page transition animation

**Files:**
- Modify: `src/app/layout.jsx:126-129` (wrap children in transition)
- Create: `src/components/PageTransition.jsx` (lightweight transition wrapper)
- Modify: `src/styles/globals.css:726-729` (remove global section animation, add page transition)

**Context:** Route changes are instant cuts with no visual transition. The global `section { animation: slideUp }` at line 728 causes ALL sections to animate on every page load, which is jarring. Replace with a clean page-level fade.

**Step 1: Remove global section animation**

In `src/styles/globals.css`, replace lines 726-729:

```css
/* Section reveal on scroll */
section {
  animation: slideUp 0.6s ease-out forwards;
}
```

With:

```css
/* Page content fade-in on route change */
.page-enter {
  animation: pageFade 0.2s ease-out;
}

@keyframes pageFade {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
```

**Step 2: Create PageTransition component**

Create `src/components/PageTransition.jsx`:

```jsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-enter');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('page-enter');
  }, [pathname]);

  return (
    <div ref={ref} className="page-enter">
      {children}
    </div>
  );
}
```

**Step 3: Wrap children in layout.jsx**

In `src/app/layout.jsx`, add the import at the top (after line 25):

```jsx
import PageTransition from '@/components/PageTransition';
```

Then replace lines 128-129:

```jsx
            <Suspense><ReferralDetector /></Suspense>
            {children}
```

With:

```jsx
            <Suspense><ReferralDetector /></Suspense>
            <PageTransition>{children}</PageTransition>
```

**Step 4: Verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

Visual check: Navigating between pages should show a subtle 200ms opacity fade instead of an instant cut.

**Step 5: Commit**

```bash
git add src/styles/globals.css src/components/PageTransition.jsx src/app/layout.jsx
git commit -m "feat: add smooth page transitions + remove jarring global section animation"
```

---

### Task 5: Rationalize z-index and fix spacing

**Files:**
- Modify: `src/styles/globals.css` (add z-index scale as CSS custom properties)
- Modify: `src/components/Player.jsx:173,397,453` (use z-index scale)
- Modify: `src/components/Navbar.jsx` (use z-index scale)
- Modify: `src/components/TrackList.jsx:211` (comment modal z-index)
- Modify: `src/app/page.jsx` (standardize section spacing)
- Modify: `src/app/merch/page.jsx:1393` (fix toast position)

**Context:** Z-indexes range from 50 to 10000 with no system. Player at z-[9999] overlaps full-screen modals. Toasts at bottom-6 hide behind the player. Homepage section spacing is inconsistent (py-10 to py-20).

**Step 1: Add z-index scale to globals.css**

In `src/styles/globals.css`, add after the `:root` color variables (after line ~26):

```css
  /* Z-index scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-nav: 300;
  --z-modal: 400;
  --z-player: 500;
  --z-overlay: 600;
  --z-toast: 700;
```

**Step 2: Update Player z-indexes**

In `src/components/Player.jsx`, replace all instances of `z-[9999]` with `z-[500]`:

- Line 173: empty state bar
- Line 397: mobile player
- Line 453: desktop player

**Step 3: Update Navbar z-index**

In `src/components/Navbar.jsx`, find the nav element with `z-50` and change to `z-[300]`. Find the mobile menu dropdown and ensure it uses `z-[300]` as well.

**Step 4: Update comment modal z-index**

In `src/components/TrackList.jsx` line 211, replace `z-[10000]` with `z-[600]`.

In `src/components/Hero.jsx` line 133 (if it has the same comment modal pattern), replace `z-[10000]` with `z-[600]`.

**Step 5: Fix merch toast position**

In `src/app/merch/page.jsx`, find the toast notification at `bottom-6 right-6 z-[60]` and change to:

```jsx
className="fixed bottom-28 md:bottom-28 right-6 z-[700] ..."
```

`bottom-28` = 112px, which clears the 88px desktop player with room to spare.

**Step 6: Standardize homepage section spacing**

In `src/app/page.jsx`, standardize all `<section>` padding to `py-16`:

- Line 104: `py-12` → `py-16` (New Releases)
- Line 120: `py-20` → `py-16` (Albums)
- Line 273: `py-12` → `py-16` (Trending)
- Line 289: `py-16` → keep (Fresh Merch — already correct)
- Line 404: `py-10` → `py-16` (LOTL Countdown)

Leave the email capture section at `py-20` — it's a standalone CTA that benefits from extra breathing room.

**Step 7: Verify**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -5`
Expected: Build succeeds.

Visual check: Modals should layer correctly over the player. Toasts visible above player. Homepage sections evenly spaced.

**Step 8: Commit**

```bash
git add src/styles/globals.css src/components/Player.jsx src/components/Navbar.jsx src/components/TrackList.jsx src/components/Hero.jsx src/app/page.jsx src/app/merch/page.jsx
git commit -m "fix: rationalize z-index scale + standardize section spacing"
```

---

### Task 6: Final build + deploy verification

**Files:** None (verification only)

**Step 1: Full build**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

**Step 2: Grep for leftover issues**

Run:
```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
grep -rn "z-\[9999\]\|z-\[10000\]" src/ --include="*.jsx" --include="*.js"
```
Expected: No results (all old z-indexes migrated).

**Step 3: Deploy**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && vercel --prod`

**Step 4: Verify all pages**

```bash
for p in / /music /search /merch /events /lounge /videos /fan-zone; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

Expected: All pages return 200.
