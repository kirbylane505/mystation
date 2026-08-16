# MyStation PWYW Pivot — Design Document (v2, CORRECTED)

**Date:** 2026-08-16
**Author:** CHANDLA, with Mike Page
**Status:** Approved (v2 corrected) — ready for implementation planning
**Model reference:** Even.com (name-your-price music pricing)
**Anchor:** LOTL Day 2026-09-05 (20 days out from design date)

---

## Origin + Correction Trail

**Mike's first instruction (2026-08-16 morning):**

> "site is free for all pay what you want thats how i want it it like even.com kinda"

CHANDLA misinterpreted this as "rip out the paywall + add a tip jar." Built a full design + implementation plan under that assumption. Started executing, shipped 5 local commits (never pushed).

**Mike's correction (2026-08-16 evening):**

> "i want my layout the same i was just saying prices like even.com"

The actual pivot: **keep the layout the same, only change the pricing mechanic to pay-what-you-want**. All 5 wrong-direction commits reverted in `f70bce7` (local only, zero prod impact). This v2 design captures the real intent.

**Follow-up decisions confirmed (2026-08-16 evening):**

- Content stays gated (Vault etc. — same paywall UX as today)
- Suggested $4.99/mo on `/subscribe`, $14.99/mo on `/premium` (matches current tier prices — preserves grandfathered psychology)
- Minimum $1/mo
- Recurring monthly subscription at the fan's chosen amount
- Existing subs keep charging on their current price (grandfathered)
- `/premium` stays as a distinct page with higher suggested amount

---

## The Model in One Sentence

Everything on MyStation stays exactly the same — layout, gating, Subscribe button, `/subscribe` page, `/premium` page, Subscribe modal — **except the fan now picks their own monthly amount** instead of choosing between fixed $4.99 / $9.99 / $14.99 tiers.

## Ten Decisions

| #   | Decision                                                                     | Rationale                                                                    |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | **Model:** Name-your-price monthly subscription                              | Even.com PRICING pattern (not their content-free model)                      |
| 2   | **Layout:** unchanged everywhere                                             | Mike's explicit correction: "i want my layout the same"                      |
| 3   | **Content gating:** unchanged (Vault etc. stays gated behind `isSubscribed`) | Mike confirmed via clarifying Q1                                             |
| 4   | **Suggested amounts:** $4.99/mo on `/subscribe`, $14.99/mo on `/premium`     | Preserves grandfathered psychology, keeps distinct upsell page               |
| 5   | **Minimum:** $1/mo                                                           | Fair floor, blocks $0 abuse, matches Even.com/Bandcamp defaults              |
| 6   | **Maximum:** $999/mo                                                         | Sanity ceiling (client + server validation)                                  |
| 7   | **Recurrence:** monthly recurring                                            | Same as today's subs; MRR-preserving; grandfather-compatible                 |
| 8   | **Existing subs:** untouched, keep charging at current price                 | Grandfather-safe; no forced migration                                        |
| 9   | **Money route:** MyStation LLC Stripe (`acct_1T1jP1R0BloCNd9r`)              | Same as today; no new Stripe infra                                           |
| 10  | **New sub tier assignment:** all new PWYW subs get `tier = 'supporter'`      | Simplifies tier logic; `monthly_amount_cents` column carries the real signal |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LAYOUT (unchanged)                                          │
│    Navbar Subscribe button                                   │
│    /subscribe page (403 lines of design stay)                │
│    /premium page (117 lines of design stay)                  │
│    SubscribeModal (382 lines — layout stays)                 │
│    /vault, gated content, isSubscribed checks — all same    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  PWYW SWAP (the only real change)                            │
│  Inside the modal / subscribe page / premium page:           │
│                                                              │
│  BEFORE:  [Regular $4.99] [Premium $9.99] [Diamond $14.99]  │
│                                                              │
│  AFTER:   Choose your monthly support:                       │
│           [$3] [$5] [$10] [$25] [Custom: $__]                │
│           Suggested: $4.99 (or $14.99 on /premium)           │
│           Minimum $1/mo                                      │
│                                                              │
│  Fan hits Subscribe → Stripe Checkout in subscription mode  │
│  with dynamic price_data.unit_amount = chosen amount        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (small changes)                                     │
│  /api/subscription/checkout: accepts amount_cents param,     │
│    replaces priceIdFor() call with inline price_data         │
│  /api/stripe/webhook: stores amount in new column            │
│    subscribers.monthly_amount_cents                          │
│  DB migration: add column + backfill grandfathered subs      │
│    (premium = 499, diamond = 1499, other = null)             │
└─────────────────────────────────────────────────────────────┘
```

**Two Stripe accounts total** (both already exist, no new ones):

- **MyStation LLC** `acct_1T1jP1R0BloCNd9r` → all subscriptions (grandfathered + new PWYW) + merch
- **MPF Foundation** (iron-locked) → nonprofit donations only, untouched

---

## Files That Change

### Frontend (3 files)

| File                                | Change                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/SubscribeModal.jsx` | Replace tier-card selector with PWYW input (preset chips + custom amount + "Continue" button). Keep header, close button, footer copy, "Founding Supporter" grandfather note, all styling. |
| `src/app/subscribe/page.jsx`        | Same swap: tier ladder → PWYW input. Default suggested $4.99. Everything else (hero, testimonials, footer) stays.                                                                          |
| `src/app/premium/page.jsx`          | Same swap. Default suggested $14.99. Different anchor, same mechanic.                                                                                                                      |

### Backend (2 files)

| File                                         | Change                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/subscription/checkout/route.js` | Accept `{ email, amount_cents }` instead of `{ email, tier, commitment_agreed }`. Validate: `100 <= amount_cents <= 99900`. Use Stripe `price_data.unit_amount` inline instead of `priceIdFor(tier)`. Drop the 6-month commitment gate (PWYW = fan-choice, no commitment).                               |
| `src/app/api/stripe/webhook/route.js`        | On `checkout.session.completed` with `metadata.type = 'subscription'`, extract `amount_cents` from `session.metadata` OR from `session.amount_subtotal`, store in `subscribers.monthly_amount_cents`. Also handle `customer.subscription.updated` to sync amount changes (fan-initiated portal updates). |

### DB (1 migration)

| File                                                   | Change                                                                                                                                                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations/2026-08-16-subscribers-monthly-amount.sql` | `ALTER TABLE subscribers ADD COLUMN monthly_amount_cents integer;` + backfill: `UPDATE subscribers SET monthly_amount_cents = 499 WHERE tier = 'premium';` and `= 1499 WHERE tier = 'diamond';` and `= 999 WHERE tier = 'creator';` |

### Polish (1 file, optional)

| File                       | Change                                                                            |
| -------------------------- | --------------------------------------------------------------------------------- |
| `src/app/account/page.jsx` | Display "You support at $X/mo" using the new column. Nice-to-have — not blocking. |

**Total: 6 files. Estimated ~4 hours implementation + verify + deploy.**

---

## What Explicitly DOESN'T Change

- Navbar Subscribe button — stays visible for non-subscribers
- `isGated()` / `isSubscribed` / `FREE_PLAY_MODE` — all untouched
- Vault gating — still requires `isSubscribed = true`
- `/password` gate — untouched (was decorative anyway; not related to PWYW)
- Any existing subscriber's charges — unaffected
- `TIERS` object in `src/lib/tiers.js` — kept for backward compat (grandfathered rows still reference it)
- `priceIdFor()` function — kept but no longer called from the checkout route (only used for legacy grandfathered lookups if needed)
- Existing Stripe Price IDs (`STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_CREATOR`) — stay in env, kept for grandfather safety
- MPF donation pipeline — iron locked, never touched
- Merch checkout, LOTL ticketing — unaffected

---

## PWYW Modal UX (the actual visual change)

```
Current:
┌──────────────────────────────────────────┐
│  Choose your support level               │
│                                          │
│  [ REGULAR    ]  [ PREMIUM  ]  [DIAMOND] │
│  $4.99/mo        $9.99/mo      $14.99/mo │
│                                          │
│    [Start Free Trial, $9.99/mo after]   │
└──────────────────────────────────────────┘

After PWYW:
┌──────────────────────────────────────────┐
│  Support MyStation                       │
│                                          │
│  Pay what you want, monthly:             │
│                                          │
│  [ $3 ] [ $5 ] [ $10 ] [ $25 ] [Custom] │
│                                          │
│  Amount:  $[  5.00  ] / month           │
│                                          │
│  Suggested: $4.99/mo · Min $1/mo         │
│                                          │
│    [ Continue to Checkout ]              │
│                                          │
│  Already supporting? You're a Founding   │
│  Supporter — nothing changes for you.    │
└──────────────────────────────────────────┘
```

**Design rules:**

- 5 preset chips: $3, $5, $10, $25, Custom
- Selecting a chip fills the amount input
- Custom lets fan type any amount (bounded $1–$999)
- Suggested amount defaults to $4.99 on `/subscribe`, $14.99 on `/premium`, `$5` on generic modal invocation
- No 6-month commitment (PWYW = fan-choice, they can cancel any time via Stripe portal)
- Keep the "Founding Supporter" grandfather note visible at the bottom

---

## Backend Contract

### `POST /api/subscription/checkout`

**Before:**

```javascript
{ tier: 'premium', email: 'a@b.com', commitment_agreed: true }
```

**After:**

```javascript
{ email: 'a@b.com', amount_cents: 500 }
```

Validation:

- `email` required, must contain `@`
- `amount_cents` required, integer, `100 <= amount_cents <= 99900`
- No `commitment_agreed` — PWYW subs have no commitment, cancellable anytime

Response: unchanged (Stripe Checkout Session URL).

### Stripe Session Config

```javascript
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer_email: email,
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: "MyStation Supporter",
          description:
            "Monthly support for IDMG artists and Mike Page Foundation programs.",
        },
        unit_amount: amount_cents,
        recurring: { interval: "month" },
      },
      quantity: 1,
    },
  ],
  metadata: {
    type: "subscription",
    tier: "supporter",
    amount_cents: String(amount_cents),
  },
  success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/subscribe`,
});
```

### Webhook Handler Extension

In `handleSubscriptionCheckout()` (existing function), extract the amount:

```javascript
const amountCents =
  session.amount_subtotal ??
  parseInt(session.metadata?.amount_cents || "0", 10) ??
  null;

await supabase.from("subscribers").upsert({
  email: customerEmail,
  stripe_customer_id: session.customer,
  stripe_subscription_id: session.subscription,
  tier: "supporter",
  status: "active",
  monthly_amount_cents: amountCents, // NEW column
  // ... existing fields untouched
});
```

Also handle `customer.subscription.updated` (fan changed amount via Stripe portal):

```javascript
if (event.type === "customer.subscription.updated") {
  const newAmountCents =
    event.data.object.items.data[0]?.price?.unit_amount ?? null;
  if (newAmountCents !== null) {
    await supabase
      .from("subscribers")
      .update({ monthly_amount_cents: newAmountCents })
      .eq("stripe_subscription_id", event.data.object.id);
  }
}
```

### DB Migration

```sql
-- 2026-08-16-subscribers-monthly-amount.sql
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS monthly_amount_cents integer;

CREATE INDEX IF NOT EXISTS idx_subscribers_monthly_amount
  ON public.subscribers(monthly_amount_cents);

-- Backfill grandfathered subs based on their existing tier.
UPDATE public.subscribers SET monthly_amount_cents = 499  WHERE tier = 'premium'  AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 999  WHERE tier = 'creator'  AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 1499 WHERE tier = 'diamond'  AND monthly_amount_cents IS NULL;

-- Add CHECK constraint for future writes (min $1, max $999).
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_monthly_amount_cents_range
  CHECK (monthly_amount_cents IS NULL OR (monthly_amount_cents >= 100 AND monthly_amount_cents <= 99900));
```

---

## Grandfather Behavior

| Scenario                            | Behavior                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| Existing sub, does nothing          | Keeps paying at old fixed price ($4.99 or $14.99). `monthly_amount_cents` backfilled from tier. |
| Existing sub visits `/account`      | Sees "You support at $4.99/mo" (or whatever their tier maps to)                                 |
| Existing sub wants to change amount | Uses Stripe Customer Portal → adjust subscription → webhook updates `monthly_amount_cents`      |
| Existing sub cancels                | Stripe portal → cancel at period end → existing webhook handler runs                            |
| New visitor after PWYW ships        | Hits Subscribe modal → picks amount → charges monthly at that amount                            |
| Fan wants to increase support       | Cancels + re-subscribes at new amount, OR uses Stripe portal (either works)                     |

**Nothing about the grandfathered experience changes.** Their price is locked to what they signed up for. Only NEW subs get the PWYW input.

---

## Testing & Verification

### Pre-push local gates

```bash
cd ~/MikePageEmpire/apps/mystation

# 1. Build cleanly
npm run build 2>&1 | tail -5

# 2. Regression sentinels — old tier logic still works
grep -n "priceIdFor\|normalizeTier" src/lib/tiers.js
# Expect: functions still exist (grandfather compat)

# 3. New checkout accepts amount_cents
grep -n "amount_cents\|price_data" src/app/api/subscription/checkout/route.js
# Expect: both present

# 4. Modal has PWYW input
grep -n "amount\|preset\|Pay what you want" src/components/SubscribeModal.jsx
# Expect: multiple hits
```

### Post-deploy live verification

HTTP status sweep — all pages still 200:

```bash
for p in "/" "/music" "/merch" "/lotl" "/events/lotl-2026" \
         "/subscribe" "/premium" "/password" "/account"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${p}")
  printf "  %-38s %s\n" "$p" "$STATUS"
done
```

Verify the new checkout API contract:

```bash
# Should return 400 for old tier-based call (deprecated schema)
curl -sX POST https://mystationlive.com/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"premium","email":"test@test.com","commitment_agreed":true}' \
  -w "\nHTTP %{http_code}\n"
# Expect: 400 "Missing amount_cents" or similar (or 200 if you kept backward-compat — see plan)

# Should return 200 with Stripe Checkout URL for new schema
curl -sX POST https://mystationlive.com/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","amount_cents":500}' \
  -w "\nHTTP %{http_code}\n"
# Expect: 200 + { url: "https://checkout.stripe.com/..." }
```

Browser E2E:

1. Open `/subscribe` in incognito → see PWYW form with $4.99 suggested
2. Enter email + $7 → hit Continue → land on Stripe Checkout → verify amount is $7/month
3. Use test card `4242 4242 4242 4242` → complete → land on success page
4. Verify DB: new row in `subscribers` with `monthly_amount_cents = 700`
5. Verify Stripe: subscription active at $7/mo
6. Visit `/vault` in that session → content unlocked (isSubscribed=true from webhook)

### Rollback

```bash
# Instant Vercel rollback
vercel rollback --yes

# Or git revert the pivot commit(s)
git revert <pwyw-commit-sha>
git push origin main
./deploy.sh
```

Time to rollback: ~30 seconds (Vercel) or ~4 minutes (git + redeploy).

---

## Timeline

Because scope is small (~4 hours vs original 35-day two-phase plan):

```
Aug 16 (Sat) — Design doc v2 committed (this file)
Aug 16 (Sat) — Implementation plan v2 committed
Aug 16 (Sat) — Section-by-section design approval from Mike
Aug 17 (Sun) — Implementation (6 files, subagent-driven, one commit per change)
Aug 17 (Sun) — Local verification + deploy
Aug 17 (Sun) — Live E2E test with real test card
Aug 18-19    — 48h monitor window (Stripe dashboard, support inbox)
Aug 20+      — LOTL final prep (unrelated to PWYW)
```

**Total elapsed: 1-2 days from design commit to live PWYW.**

---

## Success Metrics (Sept 15 review)

| Metric                  | Baseline                 | 30-day target                                    |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| Average new-sub amount  | $4.99 (only tier picked) | $5-8 (bimodal: casual $3 + superfan $10+)        |
| New signups per week    | X (measure)              | +30-50% (lower friction to enter)                |
| Grandfathered sub churn | ?                        | <10% (nothing changes for them)                  |
| Total MRR               | current                  | equal or higher (PWYW upside from superfans)     |
| Support inbox confusion | ?                        | Minimal (layout unchanged = no visible surprise) |

---

## Kill Criteria (rollback triggers)

- Stripe webhook fails on `checkout.session.completed` with new payload
- New subs' Stripe subscription created at wrong amount
- Backfill migration corrupts existing `subscribers` rows
- Grandfathered sub sees their price change unexpectedly
- Merch checkout or LOTL ticketing breaks (untouched but verify)

Any = `vercel rollback --yes` + investigate.

---

## Open Questions (won't block ship)

1. **Should `/subscribe/success` page mention the exact amount?** Nice-to-have; can add later.
2. **Auto-badge tiers based on amount?** E.g., $10+/mo shows "Diamond Supporter" badge. Not in v1 — everyone is just "Supporter."
3. **Public leaderboard?** Not in v1 — privacy default.
4. **Tax handling:** MyStation LLC receives PWYW subs same as before. No new 1099-K exposure since it's the same account. Accountant already knows the setup.

---

## Approval Trail

- **Pricing model** (PWYW / name-your-price): Mike explicit clarification 2026-08-16 evening
- **Layout unchanged**: Mike direct quote "i want my layout the same"
- **Content gating stays**: confirmed via clarifying Q1
- **Suggested $4.99 / $14.99 minimums $1**: confirmed via clarifying Q2
- **Recurring monthly at chosen amount**: confirmed via clarifying Q3
- **`/premium` kept distinct with $14.99 anchor**: confirmed via post-rollback Q2

---

## What This Doc Supersedes

`docs/plans/2026-08-16-pwyw-pivot-design.md` v1 (committed as `c457cd5`) — described a full free-for-all + tip-jar model. **Wrong interpretation.** Left in git history for reference but does NOT reflect current intent.

`docs/plans/2026-08-16-mystation-pwyw-phase-1-implementation.md` — the wrong-model implementation plan. Being rewritten in the next commit.

Local commits reverted in `f70bce7`:

- `2644385` flipped isSubscribed default (wrong — content should stay gated)
- `f984262` Zustand migrate (wrong — not needed if default stays false)
- `0c5205c` /password redirect (unrelated to PWYW — could re-apply later if desired)
- `8f56ae8` /subscribe placeholder (wrong — layout should stay)
- `3a798a6` /premium placeholder (wrong — layout should stay)

---

## Next Step

Rewrite the implementation plan at `docs/plans/2026-08-16-mystation-pwyw-phase-1-implementation.md` to match this v2 design. Then present for Mike's section-by-section approval. Then execute via subagent-driven-development.
