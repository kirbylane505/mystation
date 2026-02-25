# MyStation A+ Polish — Surgical Strike Design

**Date:** 2026-02-23
**Goal:** Fix the 5 critical UX/polish issues that separate MyStation from A+ quality.
**Approach:** Surgical strike — highest impact, lowest risk.

---

## Strike 1: Fix Skeleton Animations

**Problem:** `animate-pulse` is globally killed in `globals.css` (lines 6-11 AND 504-511). Every skeleton/loading state across the entire app is a static grey box. Users cannot distinguish "loading" from "broken."

**Fix:**
- Remove both `animate-pulse` kill blocks from `globals.css`
- If a specific element was causing an annoying blink, fix that element with a targeted class override instead of a global kill
- Test: Merch page skeletons, homepage merch section, player "now playing" bars should all animate

**Files:** `src/styles/globals.css`

---

## Strike 2: Add loading.jsx to All Major Routes

**Problem:** Only `/`, `/music`, `/merch` have `loading.jsx`. All other routes show blank flash during navigation.

**Fix:** Create `loading.jsx` for:
- `/events` — hero placeholder + event card skeletons
- `/search` — search bar + result placeholders
- `/lounge` — game room grid skeletons
- `/videos` — video grid skeletons
- `/fan-zone` — engagement hub skeleton
- `/about` — content skeleton
- `/contact` — form skeleton

Each skeleton matches the page layout structure (header position, content grid, spacing).

**Files:** New `loading.jsx` in each route directory.

---

## Strike 3: Fix Mobile Touch Targets

**Problem:** Heart icons (16px), reactions (16px), comments (28px), search clear (32px), hamburger (40px) — all below 44px minimum.

**Fix:**
- Add padding wrappers or increase `p-*` on interactive elements to ensure 44x44px minimum
- TrackList: heart, reactions, comment buttons get `p-3` wrappers
- Search: clear button, playlist button, Spotify link get `w-11 h-11`
- Navbar: hamburger gets `w-11 h-11`
- Events: filter tabs get `py-3`

**Files:** `TrackList.jsx`, `Navbar.jsx`, `SearchPageClient.jsx`, events page

---

## Strike 4: Add Page Transition Animation

**Problem:** Route changes are instant jarring cuts with no visual transition.

**Fix:**
- Add CSS-based fade transition on route change via layout.jsx
- Use a simple opacity transition (150-200ms) triggered by pathname change
- Lightweight — no animation library, just CSS + usePathname hook

**Files:** `src/app/layout.jsx`, `src/styles/globals.css`

---

## Strike 5: Rationalize Spacing & Z-Index

**Problem:** Sections use inconsistent padding (py-10 to py-20). Z-indexes range from 50 to 10000 with no logic. Player overlaps modals. Toasts hide behind player.

**Fix:**
- Define z-index scale in globals.css as CSS custom properties:
  - `--z-nav: 100`
  - `--z-dropdown: 200`
  - `--z-modal: 300`
  - `--z-player: 400`
  - `--z-overlay: 500`
- Update components to use the scale
- Fix toast positioning to account for player height
- Standardize section padding to `py-16` baseline

**Files:** `globals.css`, `Navbar.jsx`, `Player.jsx`, `TrackList.jsx` (comment modal), `page.jsx` (homepage), merch page

---

## Success Criteria

After implementation:
1. All skeleton screens pulse during loading
2. Every major route shows a skeleton during navigation (no blank flashes)
3. All interactive elements are >= 44x44px on mobile
4. Page transitions are smooth (subtle fade)
5. Z-indexes follow a predictable scale; no overlapping elements
6. Visual spacing rhythm is consistent across sections
