# MyStation PWYW Pivot — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Kill all paywalls on mystationlive.com so every visitor lands on a fully-free site (all music, vault, search included), while grandfathered paying subscribers keep charging on their current cycle undisturbed.

**Architecture:** Surgical patch — flip the default `isSubscribed` state to `true` in the player store, redirect the dead password gate, rewrite the subscribe/premium pages as placeholders, hide subscribe CTAs in the Navbar, refresh hero/meta copy, and add a defensive `410 Gone` on the subscription-checkout API to prevent any rogue new signups. Nine commits, one per change, all reversible via `git revert`. Existing subs' Stripe charges continue via the untouched webhook.

**Tech Stack:** Next.js 15 (App Router), React 18, Zustand (player store), Tailwind CSS, Stripe (untouched sub webhook), Supabase (untouched `subscribers` table).

**Reference:** Full design at `docs/plans/2026-08-16-pwyw-pivot-design.md`. Section 5 has the 35-check verification plan — reference it, don't re-derive it.

**Ship target:** Wed Aug 20, 2026 (business hours). Then 48h monitor + Founding Supporter email by Fri Aug 22.

**Testing model:** MyStation has no automated test framework. Verification is manual `curl` + `grep` + browser checks. Every task below includes a specific manual verification step in place of "run pytest."

---

## Pre-Flight Context (READ BEFORE TASK 1)

Reading the actual codebase before writing this plan surfaced two things the design doc assumed slightly wrong. Bake these into every task:

1. **`isGated()` already returns `false`** (`src/store/playerStore.js:372`) and `FREE_PLAY_MODE = true` is already set (line 360). The design's "Change 1: flip isGated to false" is already done. The REAL enforcement point for gated content is the `isSubscribed` default in `useUserStore` — Task 1 targets that.

2. **`isPreviewOnly()`** (line 381) is what enforces the 30-second-preview paywall for non-subscribers on non-free tracks. It short-circuits to `false` when `FREE_PLAY_MODE` is true, so it's already dead-code'd. Leave it alone — Task 1 makes `isSubscribed=true` default which makes the whole conditional moot anyway.

3. **Vault access:** `src/components/AudioPlayer.jsx:663` gates vault tracks via `!vaultUnlocked`. `vaultUnlocked` is set to `true` in `MusicPageClient.jsx:89` when `isSubscribed || vaultUnlocked`. Task 1's flip cascades here automatically — flipping default `isSubscribed=true` unlocks the vault for everyone without touching vault code.

4. **Working directly on `main`** — no feature branch. All 9 commits go straight to `main` locally, then Task 10 verifies, Task 11 deploys. This matches the established pattern in the repo (see recent purge session commits `3f27acf`, `0702238`, `7a00d49`).

---

## Task 1: Flip default `isSubscribed` to `true` in playerStore

**Files:**

- Modify: `src/store/playerStore.js:252`

**Step 1: Read the current state (verify line numbers haven't drifted)**

Run: `grep -n "isSubscribed: false" src/store/playerStore.js`

Expected output: `252:      isSubscribed: false,`

If line number differs, adjust the edit target.

**Step 2: Make the change**

Edit `src/store/playerStore.js` line 252:

Before:

```javascript
      isSubscribed: false,
      supporterTier: 'free', // 'free', 'regular', 'premium', 'diamond'
```

After:

```javascript
      isSubscribed: true, // PWYW pivot 2026-08-16: default full access for all visitors
      supporterTier: 'supporter', // 'supporter' is the default post-pivot; grandfathered subs get their own tier from auth
```

**Do NOT touch** the setter functions below (lines 260-292). Those correctly set `isSubscribed` from the auth API response — grandfathered subs still get `isSubscribed: true` from their real subscription row.

**Step 3: Verify the change**

Run: `grep -n "isSubscribed:" src/store/playerStore.js | head -5`

Expected output includes:

```
252:      isSubscribed: true, // PWYW pivot 2026-08-16: default full access for all visitors
```

**Step 4: Verify local build still passes**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully` (or equivalent no-error). If build fails, revert with `git checkout src/store/playerStore.js` and investigate.

**Step 5: Commit**

```bash
git add src/store/playerStore.js
git commit -m "$(cat <<'EOF'
feat(pwyw): flip default isSubscribed to true — free access for all visitors

Default state for useUserStore.isSubscribed changes from false to true.
Result: any visitor (logged in or not) gets full content access — vault,
non-free tracks, everything. This is the core mechanism of the Phase 1
PWYW pivot per docs/plans/2026-08-16-pwyw-pivot-design.md.

Grandfathered subs unaffected — their setUser() call still writes
isSubscribed from the auth API response, and Stripe subscription
webhook keeps their DB row current.

isGated() already returns false and FREE_PLAY_MODE was already true,
so this flip cascades cleanly: vault unlock (MusicPageClient.jsx:89),
preview cutoff (playerStore.js:394) both short-circuit to full-access.

Ref: pwyw-pivot-design Change 2 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Redirect `/password` → `/`

**Files:**

- Modify (replace entire file): `src/app/password/page.jsx`

**Step 1: Read the current file (context only)**

Run: `wc -l src/app/password/page.jsx`

Expected: `95 src/app/password/page.jsx`

**Step 2: Replace the entire file**

Overwrite `src/app/password/page.jsx` with:

```jsx
import { redirect } from "next/navigation";

/**
 * /password — DEPRECATED as of 2026-08-16 PWYW pivot.
 * The private-beta gate is retired; every visitor gets full free access.
 * This route now permanently redirects to the homepage.
 * Kept as a route (not deleted) so bookmarks + backlinks don't 404.
 */
export default function PasswordPage() {
  redirect("/");
}
```

**Step 3: Verify the file compiles**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`.

**Step 4: Verify the redirect works locally (optional)**

If you have a dev server: `curl -sI http://localhost:3000/password | head -5`

Expected: `HTTP/1.1 307 Temporary Redirect` + `Location: /`.

Skip if no dev server is running — Task 11 verifies live.

**Step 5: Commit**

```bash
git add src/app/password/page.jsx src/app/password/layout.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): redirect /password → / (retire private-beta gate)

Site is now fully free for all visitors. The /password gate served no
purpose (per Aug 15 audit finding: the mystation_access cookie it set
was never read anywhere, C2 in the security deep-dive). Replaced the
whole page with a server-side redirect() to /.

Route kept (not deleted) so bookmarks + backlinks don't 404. The
layout.jsx from the earlier quick-wins commit (noindex robots) stays.

Ref: pwyw-pivot-design Change 3 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rewrite `/subscribe` as PWYW placeholder

**Files:**

- Modify (replace entire file): `src/app/subscribe/page.jsx` (currently 403 lines of tier pricing)

**Step 1: Read a slice of the current file (context)**

Run: `head -30 src/app/subscribe/page.jsx`

Confirm it's a client component with pricing tiers. We're throwing all of it out.

**Step 2: Replace the entire file**

Overwrite `src/app/subscribe/page.jsx` with:

```jsx
import Link from "next/link";

export const metadata = {
  title: "MyStation is Free",
  description:
    "MyStation is now free for everyone. No subscription needed. Support your favorite artists directly on any song page.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mystationlive.com/subscribe" },
};

export default function SubscribePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 pt-24 pb-16 bg-gradient-to-b from-mystation-navy to-black text-white">
      <div className="max-w-2xl w-full text-center">
        <p className="text-blue-400 uppercase tracking-widest text-xs font-bold mb-4">
          PWYW · Pay What You Want
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          MyStation is now <span className="text-blue-400">free</span> for
          everyone.
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          No subscription needed. Every song, every video, every playlist — on
          the house. If you love what you hear, you can support the artist
          directly on any song page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/music"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-blue-500/30 transition"
          >
            Start Listening
          </Link>
          <Link
            href="/merch"
            className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold text-white hover:bg-white/20 transition"
          >
            Shop Merch
          </Link>
        </div>
        <p className="text-sm text-gray-400 border-t border-white/10 pt-6">
          Already subscribing? Thank you — you&apos;re a{" "}
          <span className="text-blue-400 font-semibold">
            Founding Supporter
          </span>{" "}
          forever. Nothing changes for you. Manage your subscription anytime in{" "}
          <Link href="/account" className="underline hover:text-white">
            your account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
```

**Step 3: Verify the file compiles**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`.

**Step 4: Regression check — no leftover Diamond/pricing copy**

Run: `grep -n "Diamond\|\\$4.99\|\\$14.99\|Subscribe now" src/app/subscribe/page.jsx`

Expected: 0 hits (empty output).

**Step 5: Commit**

```bash
git add src/app/subscribe/page.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): rewrite /subscribe as free-for-all placeholder page

Removed the 403-line tier ladder / Stripe pricing UI. Replaced with a
concise placeholder that tells visitors MyStation is now free and
directs them to /music or /merch. Includes a soft note to existing
subscribers that they're grandfathered as Founding Supporters and
can manage their sub via /account (Stripe portal).

Existing subscribers' Stripe subs untouched — this only changes what
new visitors see when they hit /subscribe. The Stripe checkout API
route gets locked in Task 8.

Ref: pwyw-pivot-design Change 4 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Rewrite `/premium` as PWYW placeholder

**Files:**

- Modify (replace entire file): `src/app/premium/page.jsx` (currently 117 lines)

**Step 1: Replace the entire file**

Overwrite `src/app/premium/page.jsx` with:

```jsx
import Link from "next/link";

export const metadata = {
  title: "MyStation is Free",
  description:
    "MyStation is now free for everyone — no premium tier needed. Support your favorite artists directly on any song page.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mystationlive.com/premium" },
};

export default function PremiumPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 pt-24 pb-16 bg-gradient-to-b from-mystation-navy to-black text-white">
      <div className="max-w-2xl w-full text-center">
        <p className="text-blue-400 uppercase tracking-widest text-xs font-bold mb-4">
          PWYW · Pay What You Want
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
          Premium is now the <span className="text-blue-400">default</span>.
        </h1>
        <p className="text-lg text-gray-300 mb-8 leading-relaxed">
          Every song is full-length. The Vault is open. Search is free. No
          paywall. If you love the music, you can support the artist directly on
          any song page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/music"
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold text-white hover:shadow-lg hover:shadow-blue-500/30 transition"
          >
            Explore the Catalog
          </Link>
          <Link
            href="/vault"
            className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold text-white hover:bg-white/20 transition"
          >
            Enter the Vault
          </Link>
        </div>
        <p className="text-sm text-gray-400 border-t border-white/10 pt-6">
          Already on a premium plan? You&apos;re a{" "}
          <span className="text-blue-400 font-semibold">
            Founding Supporter
          </span>{" "}
          forever. Manage in{" "}
          <Link href="/account" className="underline hover:text-white">
            your account
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`.

**Step 3: Commit**

```bash
git add src/app/premium/page.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): rewrite /premium as free-for-all placeholder page

Same pattern as /subscribe — replaces the 117-line premium tier page
with a friendly placeholder that says premium is now the default.
Directs to /music and /vault (both now free) and links grandfathered
premium subs to /account for Stripe portal management.

Ref: pwyw-pivot-design Change 5 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Hide "Subscribe" CTAs in Navbar (desktop + mobile)

**Files:**

- Modify: `src/components/Navbar.jsx` (2 spots: line 361-370 desktop, line 675-688 mobile)

**Step 1: Read the current desktop subscribe block**

Run: `sed -n '360,372p' src/components/Navbar.jsx`

Expected roughly:

```jsx
{
  /* Subscribe Button */
}
{
  !isSubscribed && (
    <button
      onClick={() => usePlayerStore.getState().openSubscribeModal()}
      className="..."
    >
      Subscribe
    </button>
  );
}
```

**Step 2: Comment out (don't delete) the desktop block**

Use the Edit tool to replace the `{!isSubscribed && (...)}` desktop Subscribe button block with:

```jsx
{
  /* Subscribe Button — DISABLED 2026-08-16 PWYW pivot.
              Kept as commented code for grandfather-sub audit trail.
              To re-enable, restore the {!isSubscribed && (...)} block. */
}
{
  false && !isSubscribed && (
    <button
      onClick={() => usePlayerStore.getState().openSubscribeModal()}
      className="..."
    >
      Subscribe
    </button>
  );
}
```

**Rationale for `false &&`:** preserves the whole block for future reference / potential re-enable, but React tree-shakes it out. If we ever need it back, one 5-char edit.

**Step 3: Do the same for the mobile block**

Run: `sed -n '673,690p' src/components/Navbar.jsx`

Locate the mobile Subscribe button. Apply the same `{false && !isSubscribed && (...)}` treatment.

**Step 4: Verify neither triggers**

Run: `grep -n "openSubscribeModal" src/components/Navbar.jsx`

Expected: any remaining references should be inside `{false && ...}` blocks. Confirm visually.

**Step 5: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully` — no ESLint warnings about `false && ` (Next.js is fine with it).

**Step 6: Commit**

```bash
git add src/components/Navbar.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): hide Subscribe CTAs in Navbar (desktop + mobile)

Both Subscribe buttons in Navbar.jsx are wrapped in {false && ...} —
preserves the block for audit trail + easy re-enable if needed, but
React skips rendering. Grandfathered subs still see the same nav
(their !isSubscribed evaluates false anyway, so nothing changes for
them).

Does NOT delete SubscribeModal itself (may still fire from other
call sites for grandfathered edge cases). Full cleanup deferred to
Phase 3 (6 months post-pivot when most grandfathered subs have
naturally churned).

Ref: pwyw-pivot-design Change 6 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update homepage hero copy

**Files:**

- Modify: `src/app/page.jsx` (hero section — needs to locate exact lines)

**Step 1: Locate the hero copy**

Run: `grep -n "Stream\|Subscribe\|Get full\|Free preview\|Sign up" src/app/page.jsx | head -20`

Look for the primary hero headline and any subscribe-adjacent copy. Note the exact line numbers.

**Step 2: Read the hero section fully (~20 lines around the found lines)**

Use the Read tool to grab the hero section. Identify:

- The main H1 headline
- Any subhead / CTA copy that mentions subscribing or paywall
- Any "Preview limited to 30s" or similar friction copy

**Step 3: Rewrite hero copy**

Target message (adapt to the actual JSX structure):

- **Main headline:** `Stream all of IDMG's music free.`
- **Sub-headline:** `Support what you love. Zero paywall.`
- **Primary CTA button:** `Start Listening` → links to `/music` (or wherever it went before)
- **Secondary CTA button:** keep whatever was there for merch/events

**Do NOT** change layout, animations, images, or the underlying component structure. Text-only edit.

**Explicit removals:**

- Any "Subscribe" CTA in the hero
- Any "Preview" / "30 seconds" / "Free trial" copy
- Any "$4.99/mo" or price mention in the hero

**Step 4: Regression check**

Run: `grep -in "subscribe\|premium\|paywall\|30 second\|preview" src/app/page.jsx | head -10`

Expected: 0 hits for those words in the hero context. If any survive, verify they're in an unrelated section (e.g., a featured LOTL card) and either leave or clean up in the same commit.

**Step 5: Verify build**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`.

**Step 6: Commit**

```bash
git add src/app/page.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): rewrite homepage hero for free-for-all model

Replaced subscribe/paywall-adjacent copy in the hero with the new
positioning: "Stream all of IDMG's music free. Support what you love."
Removed any 30-second-preview or subscription CTAs. Kept layout,
animations, and images untouched — text-only edit.

Ref: pwyw-pivot-design Change 7 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update `layout.jsx` root metadata

**Files:**

- Modify: `src/app/layout.jsx` (metadata block at line 57-115, specifically the `description` fields)

**Step 1: Read the current metadata**

Run: `sed -n '57,115p' src/app/layout.jsx`

Note the current `description`, `openGraph.description`, and `twitter.description` values.

**Step 2: Update all three description fields**

Change:

- **Root `description`** (line ~63):
  - Before: whatever it is now (something about "Stream Mike Page music for free…")
  - After: `'Free streaming of all IDMG music. No paywall, no login, no limits. Support your favorite artists directly. Official IDMG merch and Love on the Lawn Festival tickets.'`

- **`openGraph.description`** (line ~74):
  - After: `'Free streaming of all IDMG music. Support what you love. Official merch and Love on the Lawn Festival tickets.'`

- **`twitter.description`** (line ~96):
  - After: `'Free streaming of all IDMG music. Support the artists. Official merch and LOTL Festival tickets.'`

**Do NOT** change the `title` fields (already updated in the earlier quick-wins commit) or any other metadata.

**Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`.

**Step 4: Regression check**

Run: `grep -n "Stream Mike Page music for free" src/app/layout.jsx`

Expected: 0 hits (old copy fully replaced).

**Step 5: Commit**

```bash
git add src/app/layout.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): update root SEO metadata for free-for-all positioning

Rewrote description / og:description / twitter:description to lead
with "Free streaming" instead of the old paywall-adjacent phrasing.
Titles unchanged (already updated in earlier quick-wins commit).

Ref: pwyw-pivot-design Change 7 (Section: Phase 1)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add `410 Gone` guard to `/api/subscription/checkout`

**Files:**

- Modify: `src/app/api/subscription/checkout/route.js` (add early-return in POST handler)

**Step 1: Read the current file**

Run: `head -40 src/app/api/subscription/checkout/route.js`

Locate the `export async function POST(request) {` line (~line 12) and the first line inside the try block.

**Step 2: Add the guard as the very first thing inside POST**

Edit `src/app/api/subscription/checkout/route.js`. Immediately after `export async function POST(request) {` (before the `try` block), add:

```javascript
export async function POST(request) {
  // PWYW pivot 2026-08-16: MyStation is now free for all.
  // New subscriptions are no longer accepted. Grandfathered subs
  // continue via Stripe (server-to-server, doesn't hit this route).
  // Existing subs cancel via Stripe Customer Portal at /api/subscription/portal.
  return new Response(
    JSON.stringify({
      error: 'MyStation is now free — no subscription needed.',
      message:
        'Every song, video, and playlist is free. Support your favorite artists directly on any song page.',
      redirect: '/subscribe',
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  // --- LEGACY CODE BELOW: unreachable after 410 above.
  // Kept for grandfathered-sub audit trail and easy revert. ---
  try {
    // ... existing code stays here, unmodified
```

**Rationale:** early `return` before the legacy code makes this a one-line revert if needed (delete the return block). Existing subs never hit this route (Stripe manages their renewals via webhooks), so no grandfather impact.

**Step 3: Also add a GET-handler guard (if GET is exported)**

Run: `grep -n "export async function" src/app/api/subscription/checkout/route.js`

If `export async function GET(` exists, add the same 410 return at the top of GET. If only POST is exported, skip.

**Step 4: Verify build passes**

Run: `npm run build 2>&1 | tail -10`

Expected: `✓ Compiled successfully`. Next.js may warn about unreachable code — that's expected (documented in the comment).

**Step 5: Verify the guard works locally (optional)**

If you have a dev server running:

```bash
curl -sX POST http://localhost:3000/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"premium","email":"test@test.com","commitment_agreed":true}' \
  -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 410` + JSON body with the "MyStation is now free" message.

Skip if no dev server — Task 11 verifies live.

**Step 6: Commit**

```bash
git add src/app/api/subscription/checkout/route.js
git commit -m "$(cat <<'EOF'
feat(pwyw): return 410 Gone on /api/subscription/checkout

Defensive guard against any rogue new subscription signup after the
PWYW pivot. Adds an early-return at the top of POST that returns
HTTP 410 with a friendly JSON message. Legacy code below the guard
is kept intact (unreachable) so this is a one-line revert if needed.

Existing subscribers unaffected — Stripe manages their renewals via
webhooks (server-to-server), not through this route. They cancel via
the Stripe Customer Portal at /api/subscription/portal.

Ref: pwyw-pivot-design "Blocking NEW Subs" (Section 4.4)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Local pre-push verification (35-check gauntlet)

**Files:** none modified. Read-only checks.

**Step 1: Run the pre-push local gates from design Section 5.1**

Run each command, verify expected output:

```bash
cd ~/MikePageEmpire/apps/mystation

# 1. Build cleanly — 0 errors
echo "=== BUILD ==="
npm run build 2>&1 | tail -5
# Expect: "✓ Compiled successfully"
```

```bash
# 2. Grep for regression sentinels
echo "=== REGRESSION SENTINELS ==="
grep -rn "'Coming Soon'" src/app/password/ && echo "FAIL: password page not rewritten" || echo "OK: password page clean"
grep -rn "track.gated" src/store/playerStore.js || echo "OK: no gated logic left"
```

```bash
# 3. Confirm NEW subscription CTAs are gone from Navbar
echo "=== NAVBAR SUBSCRIBE CTAs ==="
# Every occurrence should be inside a {false && ...} block
grep -B2 "openSubscribeModal" src/components/Navbar.jsx | head -20
```

```bash
# 4. Confirm grandfather 410 guard is in place
echo "=== 410 GUARD ==="
grep -n "status: 410\|410 Gone" src/app/api/subscription/checkout/route.js
# Expect: at least one hit
```

```bash
# 5. Confirm isSubscribed default flipped
echo "=== DEFAULT isSubscribed ==="
grep -n "isSubscribed: true" src/store/playerStore.js | head -3
# Expect: line ~252 with "PWYW pivot" comment
```

```bash
# 6. Confirm /subscribe + /premium rewritten
echo "=== SUBSCRIBE / PREMIUM PAGE COPY ==="
grep -c "MyStation is now free\|Founding Supporter" src/app/subscribe/page.jsx src/app/premium/page.jsx
# Expect: 2+ in each file (title + body)
```

```bash
# 7. Confirm hero copy updated
echo "=== HERO COPY ==="
grep -in "Stream all of IDMG" src/app/page.jsx | head -3
# Expect: 1+ hit
```

```bash
# 8. Confirm metadata updated
echo "=== METADATA ==="
grep -in "Free streaming of all IDMG" src/app/layout.jsx | head -3
# Expect: 3 hits (root desc + og desc + twitter desc)
```

**Step 2: Interpret results**

If ANY check fails: STOP. Do not deploy. Fix the failing item, re-run verification.

If ALL 8 checks pass: proceed to Task 10.

**Step 3: (No commit — this is a verification task.)**

---

## Task 10: Push to `origin/main` and deploy to prod

**Files:** none.

**Step 1: Confirm branch and commit count**

```bash
git log --oneline main -8
```

Expected: 8 recent commits from Tasks 1-8 (in order), on top of the last pre-pivot commit.

**Step 2: Push to origin**

```bash
git push origin main 2>&1 | tail -5
```

Expected: `X..Y  main -> main` — no rejections, no `--force` needed.

**Step 3: Trigger the deploy (Vercel Git auto-deploy is NOT connected — must use CLI)**

```bash
cd ~/MikePageEmpire/apps/mystation
echo "=== Deploy trigger at $(date +%H:%M:%S) ==="
./deploy.sh 2>&1 | tail -30
```

Expected final line: `=== DEPLOY COMPLETE ===` from deploy.sh.

**Step 4: Note the deploy URL and timestamp**

Deploy.sh output includes the Vercel deploy URL and verify results for /, /music, /search, /merch, /events, /events/lotl-2026, /lotl, /premium, /subscribe.

Record: deploy URL + timestamp + all page statuses. If ANY page returns non-200, proceed to Task 12 (rollback) immediately.

**Step 5: (No commit — this is a deploy task.)**

---

## Task 11: Post-deploy live verification (design Section 5.2)

**Files:** none. All curl + browser checks.

**Step 1: HTTP status sweep**

```bash
for p in "/" "/music" "/merch" "/lotl" "/events/lotl-2026" "/community" \
         "/subscribe" "/premium" "/password" "/account" "/api/trending"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${p}")
  printf "  %-38s %s\n" "$p" "$STATUS"
done
```

Expected:

- `/password` → **307** or **308** (redirect to /)
- `/subscribe`, `/premium` → **200** (rewritten placeholders)
- All others → **200**

If any fail: STOP. Go to Task 12 (rollback).

**Step 2: Verify the /password redirect actually points to /**

```bash
curl -sI https://mystationlive.com/password | grep -iE "location|http/"
```

Expected: `location: /` (bare-domain redirect).

**Step 3: Verify /subscribe rewrite is live**

```bash
curl -s https://mystationlive.com/subscribe | grep -c "MyStation is now free\|Founding Supporter"
```

Expected: `>= 2` (title + body copy).

**Step 4: Verify 410 guard is live**

```bash
curl -sX POST https://mystationlive.com/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"premium","email":"regressiontest@example.com","commitment_agreed":true}' \
  -w "\nHTTP %{http_code}\n"
```

Expected: `HTTP 410` + JSON body with "MyStation is now free — no subscription needed."

**Step 5: Browser smoke tests (manual, ~15 min)**

Open a fresh **incognito window** and run through:

| #   | Action                                | Expected result                                         |
| --- | ------------------------------------- | ------------------------------------------------------- |
| B1  | Visit `https://mystationlive.com`     | Homepage loads, no gate, no "Coming Soon"               |
| B2  | Click any song                        | Plays immediately, no modal, no paywall                 |
| B3  | Navigate to `/music`                  | Full catalog visible, no upgrade CTA in Navbar          |
| B4  | Navigate to `/vault`                  | Vault tracks accessible + playable                      |
| B5  | Navigate to `/search`, search "drake" | Results appear (or pre-existing Spotify bug documented) |
| B6  | Navigate to `/password`               | Redirects to `/`                                        |
| B7  | Navigate to `/subscribe`              | Placeholder copy visible, no pricing table              |
| B8  | Navigate to `/premium`                | Placeholder copy visible, no pricing table              |

Any FAIL → Task 12 rollback.

**Step 6: Grandfather sub check (need a real test account)**

Log into a known grandfathered sub account:

| #   | Action                      | Expected                                                                         |
| --- | --------------------------- | -------------------------------------------------------------------------------- |
| G1  | `/account` renders          | Shows sub info + Founding Supporter framing (may need Task 13's UI polish later) |
| G2  | Click "Manage subscription" | Routes to Stripe Customer Portal successfully                                    |
| G3  | View any song page          | Same free-access experience (they had this, everyone does)                       |
| G4  | Check Stripe dashboard      | Their subscription still shows `active`, next charge date unchanged              |

**Step 7: Critical money-path smoke tests (design Section 5.4)**

These CANNOT be broken by this pivot. Verify each:

| Path              | Test                                                                                                                                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Merch checkout    | Add a tee to cart on `/merch`, complete Stripe test-mode checkout with `4242 4242 4242 4242` — order lands in `merch_orders`, admin email fires |
| LOTL ticket buy   | Buy a GA ticket via `/events/lotl-2026` → verify MTL flow completes                                                                             |
| MPF donation link | Verify any footer/nav link to `mikepagefoundation.org/donate` still works                                                                       |

Any FAIL → Task 12 rollback (this is untouchable per iron locks).

**Step 8: Stripe webhook regression**

Open Stripe dashboard → Webhooks → MyStation endpoint.

Verify:

- No failed deliveries since deploy timestamp
- Recent `checkout.session.completed` events processed with 200
- Recent `customer.subscription.updated` events (from grandfathered subs) processed with 200

**Step 9: Record verification results**

Save a brief report of what passed/failed to your session notes. If everything green, proceed to Task 13 (email).

If anything red: Task 12 (rollback).

---

## Task 12: Rollback (ONLY if Task 11 uncovers regressions)

**Files:** none — pure recovery ops.

**Step 1: Instant Vercel rollback**

```bash
cd ~/MikePageEmpire/apps/mystation
vercel rollback --yes 2>&1 | tail -10
```

Expected: reverts to previous production deploy. ~30 second downtime.

**Step 2: Verify pre-pivot behavior restored**

```bash
for p in "/" "/subscribe" "/password"; do
  curl -s -o /dev/null -w "%{http_code} $p\n" "https://mystationlive.com${p}"
done
```

Expected: pre-pivot statuses (/password back to 200 with "Coming Soon" splash, /subscribe with pricing tiers).

**Step 3: (If Vercel rollback insufficient) Git revert all 8 commits**

```bash
git revert --no-edit <task-1-commit>..<task-8-commit>
git push origin main
./deploy.sh
```

**Step 4: Alert + retrospective**

Post to Mike:

- What broke (specific test that failed)
- Which task's change caused it
- Recovery time
- Next step (fix + reship, or defer)

Then STOP the plan execution here until Mike decides direction.

---

## Task 13: Send Founding Supporter email (Aug 22 or ~48h post-deploy)

**Files:** none — email ops via Resend.

**Step 1: Confirm 48-hour monitor window passed cleanly**

Check:

- Sentry (once wired): no new error class
- Stripe dashboard: no spike in failed payments or refund requests
- Support inbox (`mystationlive@gmail.com`): no confusion tickets
- Admin dashboard fan count: unchanged

**Step 2: Draft the email using the design's approved copy (Section 4.5)**

Use the exact copy from `docs/plans/2026-08-16-pwyw-pivot-design.md` — Section "Communication email".

From: `hello@mystationlive.com`
To: every row in `subscribers` WHERE `status = 'active'`
Subject: `You made MyStation free 🙏`

**Step 3: Get Mike's approval on the exact copy**

Per iron-lock feedback (`feedback_show_me_before_every_post.md`) — Mike must see + approve every send before it fires. Present the drafted email to Mike. Wait for explicit "SEND IT."

**Step 4: Fire via Resend (curl per ERR-0054)**

```bash
# Pseudo — actual command depends on how many recipients + templating
export RESEND_API_KEY=$(netlify env:get RESEND_API_KEY | tail -1)
# Batch send via Resend audience API or per-recipient loop
```

**Step 5: Log to memory**

Add a `project` type memory entry noting: pivot Phase 1 shipped, X grandfathered subs emailed on YYYY-MM-DD.

---

## Post-Phase-1 Follow-Up (NOT part of this plan)

- **Aug 23 – Sept 5:** LOTL freeze. No PWYW changes. Only critical fixes.
- **Sept 8+:** Phase 2 tip flow — its own implementation plan gets written post-LOTL.
- **6 months out:** subscription vestige cleanup (rip out SubscribeModal, AccountWall, sub webhook events) once ~90% of grandfathered subs have naturally churned.

---

## Rollback Cheat Sheet

**One commit went bad:** `git revert <commit-sha> && git push && ./deploy.sh`

**Whole deploy went bad:** `vercel rollback --yes` (30 seconds)

**Whole pivot went bad:** `git revert <task-1-sha>..<task-8-sha> --no-edit && git push && ./deploy.sh` (4 minutes)

**Nuclear option:** `git reset --hard <pre-pivot-sha> && git push --force` — DO NOT USE without Mike's explicit word.

---

## Plan Summary

| Task                          | Owner                 | Effort                                           | Blocking                  |
| ----------------------------- | --------------------- | ------------------------------------------------ | ------------------------- |
| 1. Flip isSubscribed default  | Claude                | 5 min                                            | —                         |
| 2. Redirect /password         | Claude                | 5 min                                            | Task 1                    |
| 3. Rewrite /subscribe         | Claude                | 10 min                                           | Task 1                    |
| 4. Rewrite /premium           | Claude                | 10 min                                           | Task 1                    |
| 5. Hide Navbar Subscribe CTAs | Claude                | 10 min                                           | Task 1                    |
| 6. Update hero copy           | Claude                | 10 min                                           | Task 1                    |
| 7. Update metadata            | Claude                | 5 min                                            | Task 1                    |
| 8. Add 410 guard              | Claude                | 5 min                                            | Task 1                    |
| 9. Local verification         | Claude                | 10 min                                           | Tasks 1-8                 |
| 10. Push + deploy             | Claude + Mike         | 5 min ship + 3-7 min build                       | Task 9 green              |
| 11. Live verification         | Claude                | 20 min                                           | Task 10                   |
| 12. Rollback (if needed)      | Claude                | 30 sec to 4 min                                  | —                         |
| 13. Founding Supporter email  | Claude + Mike approve | 20 min                                           | 48h monitor after Task 11 |
| **TOTAL implementation**      |                       | **~2 hrs code + 25 min verify + 3-7 min deploy** |                           |

---

## Plan complete and saved to `docs/plans/2026-08-16-mystation-pwyw-phase-1-implementation.md`.

Two execution options:

**1. Subagent-Driven (this session)** — I dispatch fresh subagent per task, review between tasks, fast iteration. Fits well because tasks are short (5-10 min each) and independent enough that a fresh subagent can execute one without needing the full prior context.

**2. Parallel Session (separate)** — Open new session in a worktree with the executing-plans skill, batch execution with checkpoints. Better if you want to walk away and come back to results, or if you want a clean context specifically for the build.

**Which approach?**
