# MyStation PWYW Pivot — Design Document

**Date:** 2026-08-16
**Author:** CHANDLA, with Mike Page
**Status:** Approved — ready for implementation planning
**Model reference:** Even.com (pay-what-you-want music platform)
**Anchor:** LOTL Day 2026-09-05 (20 days out from design date)

---

## Origin

Mike Page's direct instruction (2026-08-16):

> "site is free for all pay what you want
> thats how i want it it like even.com kinda"

Follow-up on grandfathered subs:

> "people thats paying can stay paying if they want to not pay we will not cut them out, or take them off."

This document captures the full design agreed between Mike and CHANDLA on Aug 16, 2026, ready to feed into an implementation plan.

---

## The Twelve Decisions

| #   | Decision                                                                            | Rationale                                         |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | **Model:** Even.com-style pay-what-you-want                                         | Mike's exact word                                 |
| 2   | **Money route:** MyStation LLC Stripe (`acct_1T1jP1R0BloCNd9r`)                     | Same account as merch. Zero new Stripe infra.     |
| 3   | **Content gating:** Truly everything free (Vault included, Spotify search included) | Pure Even.com. No half-measures.                  |
| 4   | **Existing subs:** Grandfather in, no force-cancel, no refund                       | Mike's word: "not cut them out, or take them off" |
| 5   | **Timing:** Phased — free access before LOTL, tip flow after                        | Zero LOTL risk, two press moments                 |
| 6   | **Approach:** Surgical patch — flip enforcement points, keep code                   | Reversible per-commit, grandfather-safe           |
| 7   | **Suggested tip amounts:** $3 / $7 / $21 / Any (min $1)                             | Bimodal casual/superfan pattern                   |
| 8   | **Supporter badge (any tipper):** Yes, visible but non-gating                       | Recognition without violating "free for all"      |
| 9   | **Founding Supporter badge (grandfathered sub):** Yes, permanent, visually distinct | Honors the people who paid when it mattered       |
| 10  | **New subs after Phase 1:** Blocked (`410 Gone` on subscription checkout)           | Prevents rogue signups after pivot                |
| 11  | **MPF donation pipeline:** Untouched (iron-locked)                                  | Standing iron lock                                |
| 12  | **Merch + LOTL tickets:** Real prices, unchanged                                    | Physical goods can't be PWYW                      |

---

## Architecture Overview

MyStation becomes two things stapled together:

```
┌─────────────────────────────────────────────────────┐
│  FREE ACCESS LAYER (Phase 1 — this week)           │
│  Every stream, video, playlist, vault, search      │
│  → isGated() returns false universally              │
│  → isSubscribed check returns true for content unlock│
│  → No login required to listen                     │
└─────────────────────────────────────────────────────┘
                       +
┌─────────────────────────────────────────────────────┐
│  TIP LAYER (Phase 2 — post-LOTL)                    │
│  "Support the artist" button on song/artist/home   │
│  → Stripe Checkout (MyStation LLC — reuses acct)   │
│  → tips table logs every payment                   │
│  → Optional "Supporter" badge in profile           │
│  → No gated content behind it (pure gratitude)     │
└─────────────────────────────────────────────────────┘

  Untouched forever:
  ┌─ Merch checkout (real prices) ─┐
  ┌─ LOTL tickets (real prices) ───┐
  ┌─ MPF donation pipeline (iron)  ─┐
  └─ Existing subscribers (grandfather) ─┘
```

**Two Stripe accounts total** (both already exist, no new ones):

- **MyStation LLC** `acct_1T1jP1R0BloCNd9r` → grandfathered subs + merch + tips
- **MPF Foundation** (iron-locked) → nonprofit donations only, untouched

**Key architectural decision:** we do NOT touch the `subscribers` table or the Stripe webhook subscription-event logic. Existing paying subscribers keep their `mystation-sub` cookie, `isSubscribed=true`, everything they had. We just make that same experience the default for everyone. New signups after Phase 1 skip the subscribe flow entirely.

---

## Phase 1 — Free Access (Aug 16–22, ~2 hours of work)

**Goal:** by end of week, any visitor lands on mystationlive.com and can stream anything without a login, gate, or modal. Existing subs stay whole. Zero data changes.

### 7 changes, one commit per change

**Change 1 — Flip `isGated()` to always return false**

- File: `src/store/playerStore.js`
- Change: `export function isGated(track) { return false; }`
- Blast radius: used in 5 files (page.jsx, MusicPageClient, playlists, search) — all instantly become free-access.

**Change 2 — Auto-satisfy `isSubscribed` in playerStore default state**

- File: `src/store/playerStore.js` — `useUserStore` default
- Change: `isSubscribed: true` (default = full access; grandfathered subs still get their own true from auth flow)
- Why: paywall enforcement uses `if (isSubscribed || vaultUnlocked)`. Flipping default = free access without ripping out the conditionals.

**Change 3 — Redirect `/password` → `/`**

- File: `src/app/password/page.jsx`
- Change: replace body with `redirect('/')` from `next/navigation`
- Result: anyone hitting the old "Coming Soon" gate lands on the real homepage.

**Change 4 — Rewrite `/subscribe` as Phase 2 placeholder**

- File: `src/app/subscribe/page.jsx`
- New copy: "MyStation is now free — no subscription needed. Support your favorite artists directly on any song page."
- Existing subs: unaffected (their subscribers row + cookies stay).

**Change 5 — Same for `/premium`**

- File: `src/app/premium/page.jsx`
- Same rewrite pattern. Route to `/music`.

**Change 6 — Hide "Subscribe" CTAs in Navbar + homepage + Hero**

- Files: `src/components/Navbar.jsx`, `src/app/page.jsx`, any `SubscribeModal` triggers
- Change: delete or comment out subscribe nav items, upgrade CTAs, "Go Premium" ribbons
- Keep: `SubscribeModal` component itself (may still fire for grandfathered subs in edge cases).

**Change 7 — Update homepage hero copy + `layout.jsx` meta description**

- Files: `src/app/page.jsx` (hero), `src/app/layout.jsx` (SEO meta)
- New hero: **"Stream all of IDMG's music free. Support what you love."**
- Meta description: lead with "Free streaming" instead of paywall-adjacent phrasing.

### Grandfather guard (defensive)

Add to `src/app/api/subscription/checkout/route.js`:

```javascript
// Refuse new subs. Grandfathered subs manage via Stripe portal.
return NextResponse.json(
  { error: "MyStation is now free — no subscription needed." },
  { status: 410 },
);
```

Result: existing subs keep renewing (Stripe handles that server-to-server, not via our API). New signups get `410 Gone`. Zero risk of a rogue signup after the pivot.

### Phase 1 impact summary

| Metric                 | Before                  | After Phase 1                              |
| ---------------------- | ----------------------- | ------------------------------------------ |
| New-visitor experience | Gated / paywall / modal | Instant free access                        |
| Existing subs          | Full access             | Full access (unchanged)                    |
| Grandfathered charges  | Continue                | Continue                                   |
| Stripe webhook logic   | Live                    | Live (untouched)                           |
| `subscribers` table    | Live                    | Live (untouched)                           |
| Files modified         | —                       | 5 pages + 1 store + 1 layout + 1 API route |
| New DB migrations      | —                       | 0                                          |
| New env vars           | —                       | 0                                          |
| Rollback               | —                       | `git revert <commit>` — instant            |

---

## Phase 2 — Tip Flow (Sept 8–15, ~5 hours of work)

**Goal:** Even.com-style "tip the artist" flow. One-tap for suggested amount, free-form for custom, optional message, no login required.

### Tip button placement

Where the button appears:

- **Song page** (`/song/[id]`) — prominent below the play controls: `♥ Support The Cubist`
- **Artist page** (`/artist/[slug]`) — top-right of artist header: `♥ Support This Artist`
- **Mini-player** (persistent bottom bar) — icon-only heart button next to currently playing track
- **Homepage hero** — soft callout: `Love what you hear? Support the movement →`
- **Album pages** — one button below the album title, tips attribute to the album's primary artist

### The Tip Modal (`<TipModal>` component)

```
┌──────────────────────────────────────────┐
│                                    ✕     │
│    Support The Cubist                   │
│    ─────────────────────                │
│                                          │
│    Choose an amount                     │
│    ┌────┐  ┌────┐  ┌────┐  ┌─────┐    │
│    │ $3 │  │ $7 │  │$21 │  │ Any │    │
│    └────┘  └────┘  └────┘  └─────┘    │
│                                          │
│    Message (optional)                   │
│    ┌────────────────────────────────┐  │
│    │ this song saved my life...     │  │
│    └────────────────────────────────┘  │
│                                          │
│    Email (for receipt only)            │
│    ┌────────────────────────────────┐  │
│    │ you@email.com                   │  │
│    └────────────────────────────────┘  │
│                                          │
│    ┌──────────────────────────────┐   │
│    │  Support with Apple Pay ─────│   │
│    └──────────────────────────────┘   │
│    or continue with card                │
│                                          │
│    100% goes to the artist. No fees    │
│    charged to you.                     │
└──────────────────────────────────────────┘
```

**Design rules:**

- Suggested amounts: $3 / $7 / $21 / Any (custom min $1)
- No signup required. Email captured at Stripe Checkout only (for receipt).
- Message field stored with the tip — Mike / artist can see fan love in the admin cockpit.
- Apple Pay / Google Pay / Link enabled by default (Stripe Payment Element).
- Mobile: full-screen bottom sheet, not centered modal.

### Stripe route (`/api/tip/create-session/route.js`)

Pattern: copy from `src/app/api/podstation/donate/route.js` (already working).

```javascript
// POST /api/tip/create-session
// Body: { songId?, artistSlug?, amount, message?, email? }

const session = await stripe.checkout.sessions.create({
  mode: "payment", // one-time, not subscription
  payment_method_types: ["card"], // Apple/Google Pay auto-enabled at dashboard level
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: `Tip for ${artistName}${songTitle ? ` — "${songTitle}"` : ""}`,
        },
        unit_amount: amount * 100, // cents
      },
      quantity: 1,
    },
  ],
  metadata: {
    type: "tip",
    songId: songId || "",
    artistSlug: artistSlug || "",
    message: message?.slice(0, 500) || "",
  },
  success_url: `${APP_URL}/tip/thank-you?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}${cancelPath}`,
});
```

- **Auth:** public (no login required per Even.com model)
- **Rate limit:** 10 tips/hour per IP (prevents spam)
- **Idempotency:** Stripe session ID uniqueness (webhook handles dupes)

### Stripe webhook handler (extends existing)

Add a new event branch in `api/stripe/webhook/route.js`:

```javascript
case 'checkout.session.completed':
  if (session.metadata?.type === 'tip') {
    await handleTipCompleted(session);
    break;
  }
  // ... existing merch + sub handlers stay untouched
```

`handleTipCompleted()`:

1. Insert row into `tips` table
2. Send confirmation email via Resend (thank you + optional receipt PDF later)
3. Send admin alert to `mystationlive@gmail.com`: `[TIP $21] Anonymous → The Cubist — "this song saved my life"`
4. If email present + not already in `subscribers` table, add as supporter

### `tips` table schema

```sql
CREATE TABLE public.tips (
  id                  bigserial PRIMARY KEY,
  stripe_session_id   text UNIQUE NOT NULL,       -- idempotency
  amount_cents        integer NOT NULL CHECK (amount_cents >= 100),
  currency            text NOT NULL DEFAULT 'usd',
  song_id             text,                       -- nullable (artist-level tips)
  artist_slug         text,                       -- nullable (song tip has both)
  supporter_email     text,                       -- nullable (Stripe-provided)
  message             text,                       -- nullable, max 500 chars
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tips_artist_slug ON public.tips(artist_slug);
CREATE INDEX idx_tips_supporter_email ON public.tips(supporter_email);
CREATE INDEX idx_tips_created_at ON public.tips(created_at DESC);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
-- No public policies. Admin dashboard reads via service role.
```

**File location:** `migrations/2026-09-XX-tips-table.sql` (per ARC20 Law 3 — schema of record in repo)

### Supporter badge

Derived from `EXISTS (SELECT 1 FROM tips WHERE supporter_email = subscribers.email)`. No new column needed.

Where it shows:

- Fan wall posts (small badge next to name)
- Admin fan list (visual indicator)
- **NOT** used to unlock content

### Post-tip thank you page

Route: `/tip/thank-you?session_id=cs_xxx`

- Fetches session from Stripe: `Thank you! Your $21 tip went to The Cubist.`
- Confetti animation (existing `canvas-confetti` dep)
- CTA: `Share your favorite track →` (social share)
- Optional: `Get updates from IDMG artists (opt-in email capture)`

### Phase 2 effort summary

| Piece                           | Files                                  | Effort  |
| ------------------------------- | -------------------------------------- | ------- |
| `<TipModal>` component          | new: `src/components/TipModal.jsx`     | 1.5h    |
| Tip button placements           | song/artist/album/mini-player/homepage | 1h      |
| `/api/tip/create-session` route | new file, copy from podstation pattern | 30min   |
| Webhook `handleTipCompleted`    | extend `api/stripe/webhook/route.js`   | 45min   |
| `tips` DB migration             | new SQL file + apply to prod           | 20min   |
| `/tip/thank-you` page           | new file                               | 30min   |
| Supporter badge (virtual field) | admin fan query update                 | 20min   |
| Copy + design polish            | across all touched files               | 45min   |
| **TOTAL**                       |                                        | **~5h** |

### Phase 2 explicit exclusions

- Recurring tips (Patreon-style — different model, out of Even.com scope)
- Multi-artist tip splits (all tips go to single artist per song)
- Physical thank-you cards / merch rewards (Kickstarter-style, out of scope)
- Anonymous browsing of who tipped what (privacy default = private)

---

## Grandfather Migration

### What existing subs SEE after Phase 1

- Homepage / any page: no visible change (they had free access, everyone does now)
- `/account`:

  Before:

  ```
  Your Plan: Diamond
  Next charge: $14.99 · Nov 15, 2026
  [Manage subscription]
  ```

  After Phase 1:

  ```
  ✨ FOUNDING SUPPORTER
  Thank you for supporting us early. MyStation is now free for everyone —
  your $14.99/mo continues funding the music.
  Next charge: $14.99 · Nov 15
  [Manage subscription →]
  ```

**Key UX rule:** never trigger SubscribeModal on a grandfathered sub. They already paid — no upsell.

### The cancel path (self-serve, Stripe-native)

"Manage subscription" button → Stripe Customer Portal (already implemented in `src/app/api/subscription/portal/route.js`).

- Fan lands on Stripe-hosted portal
- Update card, download invoices, cancel anytime
- Cancel = subscription runs until end of period, then stops
- On final period end, existing webhook (`customer.subscription.deleted`) fires → `subscribers.status = 'cancelled'`
- After cancellation: content access unchanged (everything is free)

### What DOESN'T happen (explicitly)

- ❌ Auto-cancel anyone's subscription
- ❌ Auto-refund
- ❌ Change the `subscribers` table schema
- ❌ Modify Stripe webhook subscription handlers (except adding tip branch)
- ❌ Delete SubscribeModal component (may still render for grandfathered edge cases)
- ❌ Hide their Stripe subscription from them

### Communication email (opt-in, sent ~24h post-Phase-1)

- **From:** `hello@mystationlive.com`
- **To:** every row in `subscribers` with `status='active'`
- **Subject:** `You made MyStation free 🙏`
- **Body:**
  > Hey [name],
  >
  > Something changed. MyStation is now free for everyone — every song, every video, no paywall.
  >
  > You were paying $[X.XX]/mo when we needed you most. That's why we could do this. You're a Founding Supporter forever. Your badge is live on your profile.
  >
  > **What happens now?** Your subscription keeps going as long as you want it to. Nothing changes for you. If you'd rather stop supporting monthly, [click here to manage your subscription] and cancel anytime. No hurt feelings — you already built this.
  >
  > Either way, thank you.
  >
  > — Mike

**Tone rules:** gratitude, transparency, zero guilt, cancel path visible.

### Grandfather summary

| Scenario                                                              | Behavior                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Existing sub, does nothing                                            | Keeps paying, keeps founding badge, gets everything free (like everyone)        |
| Existing sub, wants to cancel                                         | Uses Stripe portal → cancels → keeps founding badge → keeps free access         |
| Trial user mid-trial (Phase 1 day)                                    | Trial ends normally; if it converts they become a sub; if not they stay free    |
| Someone who cancelled 3 months ago                                    | Still has founding badge, free access                                           |
| Brand new visitor after Phase 1                                       | Zero friction, free access, no sub option shown, tip button available (Phase 2) |
| Attacker POSTs directly to `/api/subscription/checkout` after Phase 1 | 410 Gone response, no session created                                           |

---

## Testing & Verification

MyStation has zero automated tests. Everything is manual + curl + browser. The 35-check verification plan below IS the test suite.

### Pre-push local gates

```bash
cd ~/MikePageEmpire/apps/mystation

# 1. Build cleanly — 0 errors
npm run build 2>&1 | tail -5

# 2. Grep for regression sentinels
grep -rn "'Coming Soon'" src/app/password/
grep -rn "return true.*// paywall\|track.gated" src/store/playerStore.js

# 3. Confirm no NEW subscription CTAs got missed
grep -rn "Subscribe.*Diamond\|Subscribe.*Premium\|Upgrade to" src/components/Navbar.jsx src/app/page.jsx

# 4. Confirm grandfather guard intact
grep -n "410" src/app/api/subscription/checkout/route.js
```

### Post-deploy live verification

HTTP status checks:

```bash
for p in "/" "/music" "/merch" "/lotl" "/events/lotl-2026" "/community" \
         "/subscribe" "/premium" "/password" "/account" "/api/trending" \
         "/api/spotify/search?q=drake"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${p}")
  printf "  %-38s %s\n" "$p" "$STATUS"
done
```

Expected:

- `/password` → 307 or 308 (redirect to /)
- `/subscribe`, `/premium` → 200 (rewritten placeholder pages)
- All others → 200

### Behavior checks (browser required)

| #   | Test                                              | Expected                                        |
| --- | ------------------------------------------------- | ----------------------------------------------- |
| B1  | Open homepage in fresh incognito                  | Loads, no login gate, no "Coming Soon"          |
| B2  | Click any song                                    | Plays immediately, no modal, no paywall         |
| B3  | Navigate to `/music` in incognito                 | Full catalog visible, no upgrade CTA            |
| B4  | Navigate to `/vault` in incognito                 | Vault accessible (per "truly everything free")  |
| B5  | Navigate to `/search`, search "drake"             | Results appear (if Spotify API fix landed)      |
| B6  | Navigate to `/password`                           | Redirects to `/`                                |
| B7  | Navigate to `/subscribe`                          | Placeholder "MyStation is now free", no pricing |
| B8  | Try POST to `/api/subscription/checkout` via curl | Returns 410 with friendly message               |

### Grandfather sub check (real test account needed)

| #   | Test                                            | Expected                                                  |
| --- | ----------------------------------------------- | --------------------------------------------------------- |
| G1  | Log in as known grandfathered sub               | `/account` shows "Founding Supporter" badge + next charge |
| G2  | Click "Manage subscription"                     | Routes to Stripe Customer Portal                          |
| G3  | View a song page                                | Same free-access experience as non-sub                    |
| G4  | Stripe dashboard: verify their sub still active | Still charging on schedule                                |

### Critical money paths (CANNOT break)

| Path            | Test                                                              | Verification                                                 |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Merch checkout  | Add a tee, complete checkout with test card `4242 4242 4242 4242` | Order in `merch_orders`, admin email, Printify order created |
| LOTL ticket buy | Buy GA via `/events/lotl-2026` → MTL                              | Ticket in MTL, confirmation email                            |
| MPF donation    | Verify link still works from any footer/nav                       | Iron-locked, do not touch                                    |

**If any of these three break → rollback immediately.**

### Rollback plan

```bash
cd ~/MikePageEmpire/apps/mystation

# Instant rollback (Vercel)
vercel rollback --yes

# Verify pre-pivot behavior returns
for p in "/" "/subscribe" "/password"; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://mystationlive.com${p}"
done

# If needed: git revert + redeploy
git revert <phase-1-commit-sha> --no-edit
git push origin main
./deploy.sh
```

**Time to rollback:** ~30 seconds (Vercel) or ~4 minutes (git revert + redeploy).

---

## Timeline

Anchor: today = Aug 16, 2026 (Sat). LOTL = Sept 5, 2026 (Sat). 20 days out.

```
Aug 16 (Sat) ─── Design doc committed
Aug 17-18 ────── Implementation (7 commits)
Aug 19 ────────── Local test (35 checks)
Aug 20 (Wed) ─── Deploy Phase 1 (business hours)
Aug 20-22 ────── 48h monitor + Founding Supporter email
Aug 23 – Sept 5 ❄️ LOTL FREEZE (no PWYW changes, only critical fixes)
Sept 5 (Sat) ─── 🎉 LOTL DAY
Sept 8 (Mon) ─── Post-LOTL retro
Sept 9-10 ────── Phase 2 implementation
Sept 11 ────────── Local test
Sept 12 (Fri) ─── Deploy Phase 2
Sept 12-14 ───── 48h monitor
Sept 15 (Mon) ── "Even.com-style tip flow live" announcement
Sept 20 ──────── First metrics review
```

**Total elapsed: 35 days from today to full pivot live.**

---

## Success Metrics (to review Sept 20)

| Metric                    | Baseline             | 30-day target                                 |
| ------------------------- | -------------------- | --------------------------------------------- |
| New free signups / week   | ~0 (paywall blocked) | 50-200                                        |
| Tip conversion rate       | 0 (no mechanic)      | 0.5-2% of song-page visitors                  |
| Average tip amount        | —                    | $7-15 (bimodal $3 + $21+)                     |
| Grandfathered sub churn   | ?                    | < 20% cancelled in first 30 days              |
| Total monthly revenue     | Sub MRR              | Sub MRR (grandfather) + tip volume ≥ baseline |
| Site sessions (Plausible) | —                    | +30-50%                                       |
| Time-to-first-play        | —                    | Drops (no login step)                         |

---

## Kill Criteria (when we roll back)

If ANY of these happen in the 30 days post-Phase-1:

- **> 30% grandfathered sub churn in first week** — messaging failed
- **Merch or LOTL ticket revenue drops** — pivot cannibalized real-money paths
- **Support inbox floods with confused/angry fans** — messaging too abrupt
- **Live-site 5xx spike** — subtle regression in free-access flip

**Rollback path:** `vercel rollback` + email Founding Supporters "we're taking a beat, everything reverts, more soon."

---

## Files That Change

### Phase 1 (Aug 16-22)

- `src/store/playerStore.js` — `isGated()` returns false, `isSubscribed` default true
- `src/app/password/page.jsx` — redirect to `/`
- `src/app/subscribe/page.jsx` — placeholder copy
- `src/app/premium/page.jsx` — placeholder copy
- `src/components/Navbar.jsx` — hide Subscribe CTAs
- `src/app/page.jsx` — hero copy update
- `src/app/layout.jsx` — meta description update
- `src/app/api/subscription/checkout/route.js` — 410 Gone for new signups
- 7 commits total, one per change

### Phase 2 (Sept 8-15)

- NEW `src/components/TipModal.jsx`
- NEW `src/app/api/tip/create-session/route.js`
- NEW `src/app/tip/thank-you/page.jsx`
- NEW `migrations/2026-09-XX-tips-table.sql`
- `src/app/api/stripe/webhook/route.js` — extended with tip handler
- `src/app/song/[id]/*` — tip button mount
- `src/app/artist/[slug]/*` — tip button mount
- Mini-player component — tip icon
- Homepage hero — soft callout

---

## What Stays Untouched (Forever)

- MPF donation pipeline (iron locked)
- Merch checkout + Printify/Printful webhook logic
- LOTL ticketing (routes to MTL)
- Stripe subscription webhook events (grandfathered subs keep renewing)
- `subscribers` table schema
- `AccountWall`, `SubscribeModal`, `ListenFreeModal` component files (may still render for grandfathered edge cases)

---

## Open Questions (won't block Phase 1)

1. **Internal tip distribution:** The tip modal promises "100% goes to the artist." How does MyStation LLC pay The Cubist his cut monthly? Manual payout? Stripe Connect? Post-LOTL problem.
2. **Public tip leaderboard:** Does the world see "The Cubist earned $342 this month in tips"? Defaults to private. Can add public leaderboard later if it drives more support.
3. **Recurring tips (Patreon-style):** Out of Phase 2 scope. If a superfan wants to auto-tip $10/mo, that's Phase 3.
4. **Anonymous vs named tips:** Default private (fan email captured for receipt only). Opt-in for name visibility on artist pages.
5. **Tax handling:** MyStation LLC receives tips as revenue (not tax-deductible for the fan since it's a for-profit LLC). Accountant call before Phase 2 ship — 1099-K reporting from Stripe?
6. **Post-Phase-2 marketing:** How loud on the "MyStation is free" announcement? Press release? Blog post? Social campaign? SCARFACE agent territory.
7. **Long-term subscription vestige cleanup:** In 6 months when ~90% of grandfathered subs have naturally churned, we can rip out SubscribeModal / AccountWall / subscription webhook events. Not urgent.

---

## Approval Trail

- **Money route** (MyStation LLC): approved 2026-08-16
- **Content gating** (truly everything free): approved 2026-08-16
- **Timing** (phased, free access before LOTL): approved 2026-08-16
- **Grandfather** (no force-cancel): Mike's direct instruction 2026-08-16
- **Approach A** (surgical patch, not full rip): approved 2026-08-16
- **Full 7-section design**: approved 2026-08-16, section by section

---

## Next Step

Invoke the `writing-plans` skill to break Phase 1 into a task-by-task implementation plan. That plan becomes the roadmap for the Aug 17-18 build days. Nothing gets built until Mike approves the implementation plan too.
