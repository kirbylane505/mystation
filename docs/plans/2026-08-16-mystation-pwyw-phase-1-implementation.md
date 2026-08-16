# MyStation PWYW Pivot — Implementation Plan (v2, CORRECTED)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development for same-session execution) to implement this plan task-by-task.

**Goal:** Swap the fixed-tier subscribe UI ($4.99 / $9.99 / $14.99 buttons) for a pay-what-you-want amount input (suggested $4.99 / $14.99, minimum $1/mo). Layout stays the same everywhere. Content stays gated. Grandfathered subs keep charging at their current price. Backend uses Stripe `price_data.unit_amount` inline instead of fixed Price IDs.

**Architecture:** Frontend swap in 3 files (SubscribeModal, `/subscribe`, `/premium`). Backend swap in 2 files (checkout route contract change + webhook amount capture). 1 DB migration adding `monthly_amount_cents` column with backfill. Optional polish on `/account` page. Single deployment, ~4 hours total.

**Tech Stack:** Next.js 15 App Router, React 18, Tailwind, Zustand (untouched), Stripe (dynamic `price_data`), Supabase Postgres.

**Reference:** Full design at `docs/plans/2026-08-16-pwyw-pivot-design.md` (v2). This plan supersedes v1 (committed as `49f08f8`) which was built for the wrong "rip out paywall + add tip jar" interpretation.

**Ship target:** Sun Aug 17 — Mon Aug 18, 2026.

**Testing model:** MyStation has no test framework. Verification is manual `curl` + `grep` + `npm run build` + browser + Stripe dashboard.

---

## Pre-Flight Context (READ BEFORE TASK 1)

The 5 wrong-direction commits from earlier this session were reverted in `f70bce7` (local only, never pushed). Working tree state matches pre-pivot code. Verify with:

```bash
cd ~/MikePageEmpire/apps/mystation
git status                                          # expect: clean
git log --oneline -3                                # expect: f70bce7 (revert) is HEAD
grep -n "isSubscribed: false" src/store/playerStore.js       # expect: line 252 (original)
wc -l src/app/subscribe/page.jsx src/app/premium/page.jsx    # expect: 403 + 117
```

If any of the above is off, STOP and investigate before proceeding.

**Working directly on `main`** — Mike consented, matches established pattern in this repo, tiny reversible commits.

---

## Task Order

| #      | Task                                                            | Est                         | Blocking    |
| ------ | --------------------------------------------------------------- | --------------------------- | ----------- |
| P2-T1  | DB migration — add `monthly_amount_cents` column + backfill     | 20 min                      | —           |
| P2-T2  | Rewrite `/api/subscription/checkout/route.js` for PWYW contract | 45 min                      | P2-T1       |
| P2-T3  | Extend `/api/stripe/webhook/route.js` to capture amount         | 30 min                      | P2-T1       |
| P2-T4  | Rewrite SubscribeModal.jsx for PWYW input                       | 45 min                      | P2-T2       |
| P2-T5  | Rewrite `/subscribe/page.jsx` for PWYW form (suggested $4.99)   | 30 min                      | P2-T4       |
| P2-T6  | Rewrite `/premium/page.jsx` for PWYW form (suggested $14.99)    | 20 min                      | P2-T4       |
| P2-T7  | (Polish) `/account/page.jsx` show "You support at $X/mo"        | 20 min                      | P2-T3       |
| P2-T8  | Local pre-push verification                                     | 15 min                      | P2-T1–P2-T7 |
| P2-T9  | Push + deploy                                                   | 10 min ship + 3-7 min build | P2-T8 green |
| P2-T10 | Live E2E verification with real test card                       | 20 min                      | P2-T9       |
| P2-T11 | Rollback (only if P2-T10 fails)                                 | 30s to 4 min                | —           |

**Total: ~4 hours code + 25 min verify + 3-7 min deploy.**

Tasks P2-T2, P2-T3 depend on P2-T1 landing first (DB column must exist before code writes to it). Tasks P2-T5, P2-T6 depend on P2-T4 (Modal is imported by both pages — actually no, wait: /subscribe and /premium are page-level PWYW forms, not modal-triggered. Confirm during T4 whether they share a component.).

---

## Task P2-T1: DB migration — add `monthly_amount_cents` column + backfill

**Files:**

- Create: `migrations/2026-08-16-subscribers-monthly-amount.sql`
- Apply: to Supabase production via dashboard (Mike has service role) or via `psql` if wired

**Step 1: Create the migration file**

Write `migrations/2026-08-16-subscribers-monthly-amount.sql`:

```sql
-- 2026-08-16 PWYW pivot: add monthly_amount_cents to subscribers
-- Design ref: docs/plans/2026-08-16-pwyw-pivot-design.md (v2)
-- Backfills grandfathered subs based on their existing tier so they
-- keep charging at their original price and /account can display "You
-- support at $X/mo".

ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS monthly_amount_cents integer;

CREATE INDEX IF NOT EXISTS idx_subscribers_monthly_amount
  ON public.subscribers(monthly_amount_cents);

-- Backfill from existing tier values.
UPDATE public.subscribers SET monthly_amount_cents = 499  WHERE tier = 'premium'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 999  WHERE tier = 'creator'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 1499 WHERE tier = 'diamond'   AND monthly_amount_cents IS NULL;
UPDATE public.subscribers SET monthly_amount_cents = 499  WHERE tier = 'supporter' AND monthly_amount_cents IS NULL;

-- Validate future writes: min $1/mo, max $999/mo.
ALTER TABLE public.subscribers
  DROP CONSTRAINT IF EXISTS subscribers_monthly_amount_cents_range;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_monthly_amount_cents_range
  CHECK (monthly_amount_cents IS NULL OR (monthly_amount_cents >= 100 AND monthly_amount_cents <= 99900));

-- Verification queries (run manually after apply):
-- SELECT tier, count(*), min(monthly_amount_cents), max(monthly_amount_cents)
--   FROM public.subscribers GROUP BY tier;
-- Expect: premium/creator/diamond/supporter rows all have non-null amounts;
-- other rows (free, cancelled) may still have null.
```

**Step 2: Verify SQL syntax with a dry-run**

If a local Supabase container is running, apply against it. Otherwise skip — apply to prod in Step 3.

**Step 3: Apply to Supabase production**

Two options (pick whichever Mike prefers):

- **Supabase dashboard:** SQL Editor → paste the migration → Run
- **Automated:** if `SUPABASE_DB_URL` is in env, `psql "$SUPABASE_DB_URL" -f migrations/2026-08-16-subscribers-monthly-amount.sql`

**Verify with:**

```sql
SELECT tier, count(*), min(monthly_amount_cents), max(monthly_amount_cents)
FROM public.subscribers GROUP BY tier;
```

Expect: every non-null tier has a non-null amount.

**Step 4: Commit the migration file to repo (ARC20 Law 3 — schema of record)**

```bash
cd ~/MikePageEmpire/apps/mystation
git add migrations/2026-08-16-subscribers-monthly-amount.sql
git commit -m "$(cat <<'EOF'
feat(pwyw): DB migration — add subscribers.monthly_amount_cents + backfill

Adds monthly_amount_cents column to subscribers table. Backfills
grandfathered subs based on their existing tier so they keep charging
at their original price and /account can show "You support at $X/mo":

  premium   -> 499 cents ($4.99/mo)
  creator   -> 999 cents ($9.99/mo)
  diamond   -> 1499 cents ($14.99/mo)
  supporter -> 499 cents (default assumption)

Includes CHECK constraint validating min $1/mo, max $999/mo.

Applied to Supabase production before this commit lands, per ARC20 Law
3 (immutable evidence — schema of record in repo).

Ref: pwyw-pivot-design v2 (DB Migration section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T2: Rewrite `/api/subscription/checkout/route.js` for PWYW contract

**Files:**

- Modify: `src/app/api/subscription/checkout/route.js` (currently 114 lines)

**Contract change:**

- Before: `{ tier, email, commitment_agreed }`
- After: `{ email, amount_cents }`

**Step 1: Read the current file to understand what to preserve**

```bash
cat src/app/api/subscription/checkout/route.js
```

Note: existing logic includes `stripe.customers.list` lookup + `stripe.subscriptions.list` to prevent duplicate active subs. **Preserve that logic** — critical for grandfather safety.

**Step 2: Rewrite the POST handler**

Replace the entire POST function body with this pattern (keep the existing imports at the top):

```javascript
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, amount_cents } = body;

    // Validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 },
      );
    }

    const amount = Number(amount_cents);
    if (!Number.isInteger(amount) || amount < 100 || amount > 99900) {
      return NextResponse.json(
        {
          error:
            "amount_cents must be an integer between 100 ($1) and 99900 ($999)",
        },
        { status: 400 },
      );
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Grandfather safety: check for existing active sub
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        return NextResponse.json(
          {
            error:
              "You already have an active subscription. Manage it in your account.",
            existing_subscription_id: subs.data[0].id,
          },
          { status: 409 },
        );
      }
    }

    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL || "https://mystationlive.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId, // undefined = Stripe creates new
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "MyStation Supporter",
              description:
                "Monthly support for IDMG artists and Mike Page Foundation programs.",
            },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "subscription",
        tier: "supporter",
        amount_cents: String(amount),
      },
      subscription_data: {
        metadata: {
          type: "subscription",
          tier: "supporter",
          amount_cents: String(amount),
        },
      },
      success_url: `${APP_URL}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/subscribe`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("subscription/checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session", detail: err?.message },
      { status: 500 },
    );
  }
}
```

**Step 3: Drop the top-level `CHECKOUT_ALLOWED_TIERS` constant and the `normalizeTier`/`priceIdFor` imports if they're no longer used**

Check after edit:

```bash
grep -n "normalizeTier\|priceIdFor\|CHECKOUT_ALLOWED_TIERS" src/app/api/subscription/checkout/route.js
```

Expect: 0 hits.

**Step 4: Verify build passes**

```bash
npm run build 2>&1 | tail -10
```

Expect `✓ Compiled successfully`.

**Step 5: Commit**

```bash
git add src/app/api/subscription/checkout/route.js
git commit -m "$(cat <<'EOF'
feat(pwyw): rewrite subscription checkout for name-your-price amount

Contract change:
  Before: { tier, email, commitment_agreed }
  After:  { email, amount_cents }

Uses Stripe price_data.unit_amount inline for the fan's chosen monthly
amount instead of fixed priceIdFor(tier). Preserves grandfather safety
check (existing active sub -> 409). Preserves customer dedup via
stripe.customers.list. Drops the 6-month commitment gate (PWYW subs
are cancel-anytime via Stripe portal).

Validation: amount_cents must be integer, 100 <= n <= 99900.

New sub metadata: tier='supporter', amount_cents=<chosen>. Webhook
(handleSubscriptionCheckout) reads amount_subtotal or metadata to
populate the new subscribers.monthly_amount_cents column.

Existing subs unaffected — Stripe manages their renewals via
subscription-mode webhooks, doesn't hit this route.

Ref: pwyw-pivot-design v2 (Backend Contract section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T3: Extend `/api/stripe/webhook/route.js` to capture amount

**Files:**

- Modify: `src/app/api/stripe/webhook/route.js` (large file, ~1400+ lines after earlier reflow)

**Step 1: Locate `handleSubscriptionCheckout` or the checkout.session.completed subscription handler**

```bash
grep -n "handleSubscriptionCheckout\|subscription checkout\|mode.*subscription" src/app/api/stripe/webhook/route.js | head -10
```

**Step 2: Extract `monthly_amount_cents` when writing the subscribers row**

Add this near the top of `handleSubscriptionCheckout(session)` (adjust to actual function shape):

```javascript
const monthlyAmountCents =
  Number(session.amount_subtotal) ||
  Number(session.metadata?.amount_cents) ||
  null;
```

Then include `monthly_amount_cents: monthlyAmountCents` in the `.upsert()` or `.insert()` call that writes to `subscribers`.

**Step 3: Handle amount changes via `customer.subscription.updated`**

Locate the existing handler for `customer.subscription.updated` (or add one if missing). At the top of the handler:

```javascript
if (event.type === "customer.subscription.updated") {
  const sub = event.data.object;
  const newAmount = sub.items?.data?.[0]?.price?.unit_amount ?? null;
  if (newAmount !== null) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from("subscribers")
        .update({ monthly_amount_cents: newAmount })
        .eq("stripe_subscription_id", sub.id);
    }
  }
  // ... existing handler continues
}
```

**Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

**Step 5: Commit**

```bash
git add src/app/api/stripe/webhook/route.js
git commit -m "$(cat <<'EOF'
feat(pwyw): capture subscription amount in webhook (monthly_amount_cents)

Extends the Stripe webhook to store the fan's chosen monthly amount
in the new subscribers.monthly_amount_cents column.

Two paths covered:
1. checkout.session.completed (subscription mode): reads
   session.amount_subtotal OR session.metadata.amount_cents fallback,
   writes to subscribers row on upsert.
2. customer.subscription.updated: reads new price.unit_amount from
   the subscription item, updates subscribers.monthly_amount_cents.
   Covers fan-initiated amount changes via Stripe portal.

Grandfathered subs unaffected — their existing rows keep the
backfilled amount from the T1 migration.

Ref: pwyw-pivot-design v2 (Webhook Handler Extension section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T4: Rewrite SubscribeModal.jsx for PWYW input

**Files:**

- Modify: `src/components/SubscribeModal.jsx` (382 lines)

**Design constraint:** keep the modal's overall visual layout (header, close button, footer, styling). Replace only the tier-card selector + Start-Free-Trial button with:

- 5 preset chips: $3 / $5 / $10 / $25 / Custom
- Amount input field (bound to selected chip; editable in Custom mode)
- Suggested-amount hint below input
- "Continue to Checkout" button (POSTs to `/api/subscription/checkout` with `{ email, amount_cents }`)

**Step 1: Read the current SubscribeModal to understand structure**

```bash
sed -n '1,50p' src/components/SubscribeModal.jsx      # imports, tier data
sed -n '200,290p' src/components/SubscribeModal.jsx   # tier picker JSX + submit button
```

Note where:

- `tiers` array is defined (line ~100)
- Tier selector renders (`selectedTier` state)
- Submit button calls Stripe (line ~287)

**Step 2: Replace tier data + selector**

Remove the `tiers` array (lines ~100–160 approx). Replace with a PWYW state block near the top of the component:

```javascript
const PRESET_AMOUNTS = [300, 500, 1000, 2500]; // $3, $5, $10, $25
const SUGGESTED_AMOUNT = 499; // $4.99 default
const MIN_CENTS = 100;
const MAX_CENTS = 99900;

const [selectedPreset, setSelectedPreset] = useState(SUGGESTED_AMOUNT);
const [customMode, setCustomMode] = useState(false);
const [customAmount, setCustomAmount] = useState(SUGGESTED_AMOUNT);

const finalAmountCents = customMode ? customAmount : selectedPreset;
const amountDisplay = (finalAmountCents / 100).toFixed(2);
const isValidAmount =
  finalAmountCents >= MIN_CENTS && finalAmountCents <= MAX_CENTS;
```

**Step 3: Replace the tier selector JSX with PWYW UI**

Where the tier cards render, replace with:

```jsx
<div className="mb-6">
  <p className="text-sm text-gray-400 mb-3">Pay what you want, monthly:</p>
  <div className="flex flex-wrap gap-2 mb-4">
    {PRESET_AMOUNTS.map((cents) => (
      <button
        key={cents}
        type="button"
        onClick={() => {
          setSelectedPreset(cents);
          setCustomMode(false);
        }}
        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
          !customMode && selectedPreset === cents
            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
            : "bg-white/10 text-white/70 hover:bg-white/20"
        }`}
      >
        ${cents / 100}
      </button>
    ))}
    <button
      type="button"
      onClick={() => setCustomMode(true)}
      className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
        customMode
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          : "bg-white/10 text-white/70 hover:bg-white/20"
      }`}
    >
      Custom
    </button>
  </div>

  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-bold">
      $
    </span>
    <input
      type="number"
      min="1"
      max="999"
      step="0.01"
      value={amountDisplay}
      onChange={(e) => {
        const cents = Math.round(parseFloat(e.target.value || "0") * 100);
        setCustomMode(true);
        setCustomAmount(cents);
      }}
      className="w-full pl-10 pr-16 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-blue-500"
    />
    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
      / month
    </span>
  </div>

  <p className="text-xs text-gray-500 mt-2 text-center">
    Suggested $4.99/mo · Minimum $1/mo · Cancel anytime
  </p>
</div>
```

**Step 4: Replace the submit button**

```jsx
<button
  type="button"
  onClick={handleContinue}
  disabled={!email || !isValidAmount || loading}
  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50"
>
  {loading ? "Redirecting to checkout..." : `Continue at $${amountDisplay}/mo`}
</button>
```

**Step 5: Update `handleContinue` (or equivalent) to POST the new payload**

```javascript
async function handleContinue() {
  setLoading(true);
  try {
    const res = await fetch("/api/subscription/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount_cents: finalAmountCents }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || "Failed to create checkout session");
      setLoading(false);
    }
  } catch (err) {
    setError("Network error. Please try again.");
    setLoading(false);
  }
}
```

**Step 6: Delete the `STRIPE_LINKS` const and any tier-related helpers no longer used**

**Step 7: Verify build passes**

```bash
npm run build 2>&1 | tail -10
```

**Step 8: Regression check — no lingering tier-price copy**

```bash
grep -n "\\$4.99\|\\$9.99\|\\$14.99\|Regular\|Premium\|Diamond" src/components/SubscribeModal.jsx
```

Expect: only the `SUGGESTED_AMOUNT = 499` constant may match `\\$4.99` indirectly. If any hardcoded tier price copy survives, remove it.

**Step 9: Commit**

```bash
git add src/components/SubscribeModal.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): SubscribeModal shows name-your-price input, not fixed tiers

Replaced the 3-tier picker ($4.99 Regular / $9.99 Premium / $14.99
Diamond) with a pay-what-you-want UI:

- 5 preset chips: $3, $5, $10, $25, Custom
- Amount input field (bound to selected chip; editable in Custom mode)
- Suggested $4.99/mo, minimum $1/mo, cancel anytime
- "Continue at $X.XX/mo" button POSTs to /api/subscription/checkout
  with { email, amount_cents } (matches the new route contract)

Modal shell (header, close button, footer, Founding Supporter note)
unchanged. Removed STRIPE_LINKS const + tier-price copy.

Ref: pwyw-pivot-design v2 (PWYW Modal UX section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T5: Rewrite `/subscribe/page.jsx` for PWYW form (suggested $4.99)

**Files:**

- Modify: `src/app/subscribe/page.jsx` (403 lines)

**Design constraint:** keep the page's visual identity (hero, testimonials, footer, background gradients, all the surrounding design). Replace ONLY the tier ladder / pricing UI with the same PWYW pattern used in SubscribeModal (but rendered as a page, not a modal).

**Approach:** since the SubscribeModal now has the PWYW component pattern, the fastest path is to extract the PWYW form JSX into a reusable component AT THIS STEP if the copy overlap is high, OR inline the same pattern into the page.

**Step 1: Read the current /subscribe page structure**

```bash
cat src/app/subscribe/page.jsx | head -100
grep -n "\\$4.99\|\\$9.99\|\\$14.99\|tier\|Stripe" src/app/subscribe/page.jsx
```

Identify:

- The hero section (keep)
- The tier ladder (replace with PWYW)
- Any testimonial/social-proof sections (keep)
- The footer / grandfather note (keep or add if missing)

**Step 2: Replace the tier ladder with PWYW form**

Use the same PWYW UI pattern from SubscribeModal (preset chips + amount input + Continue button) but at page scale. Suggested default: `SUGGESTED_AMOUNT = 499` ($4.99).

Consider extracting a shared `<PWYWForm />` component at `src/components/PWYWForm.jsx` if the same JSX is used in 2+ places. If time-pressed, inline it and refactor later.

**Step 3: Verify build passes**

```bash
npm run build 2>&1 | tail -10
```

**Step 4: Regression check**

```bash
grep -n "\\$4.99\|\\$9.99\|\\$14.99\|Diamond" src/app/subscribe/page.jsx
```

Expect: only the `SUGGESTED_AMOUNT = 499` and display copy that says "Suggested $4.99/mo" — no hardcoded tier ladder.

**Step 5: Commit**

```bash
git add src/app/subscribe/page.jsx src/components/PWYWForm.jsx  # (if extracted)
git commit -m "$(cat <<'EOF'
feat(pwyw): /subscribe page shows PWYW form (suggested \$4.99)

Layout preserved — same hero, background gradients, and surrounding
design as before. Only the tier ladder swapped for the PWYW form
(same pattern as SubscribeModal).

Suggested default $4.99/mo (matches old Regular tier for grandfathered
psychology). Preset chips: \$3, \$5, \$10, \$25, Custom. Minimum \$1/mo.

Ref: pwyw-pivot-design v2 (Files That Change section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T6: Rewrite `/premium/page.jsx` for PWYW form (suggested $14.99)

**Files:**

- Modify: `src/app/premium/page.jsx` (117 lines)

**Same pattern as P2-T5, but the suggested default is $14.99** (anchors as the "higher-tier support" page).

**Step 1: Same as T5, applied to `/premium/page.jsx` with `SUGGESTED_AMOUNT = 1499`**

**Step 2: Verify build passes**

**Step 3: Commit**

```bash
git add src/app/premium/page.jsx
git commit -m "$(cat <<'EOF'
feat(pwyw): /premium page shows PWYW form (suggested $14.99)

Same PWYW pattern as /subscribe but with a higher suggested amount
($14.99/mo vs $4.99). Positions /premium as the higher-tier support
page while sharing the same PWYW mechanic under the hood.

Layout + surrounding design preserved. Suggested default $14.99/mo
matches the old Diamond tier price for grandfathered psychology.

Ref: pwyw-pivot-design v2 (Suggested Amounts section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T7 (Polish): `/account/page.jsx` show "You support at $X/mo"

**Files:**

- Modify: `src/app/account/page.jsx`

**Nice-to-have. Skip if time-pressed; can ship as follow-up.**

**Step 1: Read the current /account page**

```bash
grep -n "supporterTier\|tier\|monthly_amount" src/app/account/page.jsx
```

**Step 2: Add a line displaying the monthly amount**

Somewhere in the "Your Plan" / subscription summary block:

```jsx
{
  isSubscribed && monthlyAmountCents && (
    <p className="text-sm text-gray-400 mt-2">
      You support at{" "}
      <span className="text-white font-bold">
        ${(monthlyAmountCents / 100).toFixed(2)}/mo
      </span>
      . Thank you.
    </p>
  );
}
```

Where `monthlyAmountCents` comes from an existing user-store field or a `/api/subscription/session` call (already exists per the earlier audit).

If the field isn't already exposed to the client, add it to the response of `/api/subscription/session` (the route reads from Supabase — just SELECT the new column too).

**Step 3: Verify build + commit**

```bash
git add src/app/account/page.jsx  # + any API route touched
git commit -m "$(cat <<'EOF'
polish(pwyw): show "You support at \$X/mo" on /account

Displays each subscriber's actual monthly amount (from the new
subscribers.monthly_amount_cents column) instead of a generic tier
label. Grandfathered subs see their backfilled amount ($4.99 for
premium, $14.99 for diamond etc.).

Ref: pwyw-pivot-design v2 (Polish section)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task P2-T8: Local pre-push verification

**Files:** none modified. Read-only checks.

**Step 1: Build cleanly**

```bash
cd ~/MikePageEmpire/apps/mystation
npm run build 2>&1 | tail -10
```

Expect `✓ Compiled successfully`.

**Step 2: Regression sentinels**

```bash
# 1. Confirm PWYW contract on checkout route
grep -n "amount_cents\|price_data\|unit_amount" src/app/api/subscription/checkout/route.js | head -5
# Expect: 3+ hits

# 2. Confirm webhook captures amount
grep -n "monthly_amount_cents\|amount_subtotal" src/app/api/stripe/webhook/route.js | head -5
# Expect: 2+ hits

# 3. Confirm SubscribeModal has PWYW input
grep -n "PRESET_AMOUNTS\|customAmount\|amount_cents" src/components/SubscribeModal.jsx | head -5
# Expect: 3+ hits

# 4. Confirm no leftover fixed tier prices in the 3 UI files
grep -n "\\$4.99\|\\$9.99\|\\$14.99" src/components/SubscribeModal.jsx src/app/subscribe/page.jsx src/app/premium/page.jsx
# Expect: only in "Suggested $4.99/mo" copy or SUGGESTED_AMOUNT constants — no tier ladder

# 5. Confirm DB migration file exists
ls -la migrations/2026-08-16-subscribers-monthly-amount.sql
```

**Step 3: Verify DB migration was applied to prod**

```bash
# Via Supabase SQL editor or psql:
# SELECT tier, count(*), min(monthly_amount_cents), max(monthly_amount_cents)
#   FROM public.subscribers GROUP BY tier;
```

Any non-null tier should have non-null monthly_amount_cents. If migration NOT yet applied, apply it before pushing.

**Step 4: (No commit — verification only)**

---

## Task P2-T9: Push + deploy

**Step 1: Confirm commit count**

```bash
git log --oneline main -8
```

Expect: recent commits from Tasks T1–T7 plus the revert `f70bce7`.

**Step 2: Push**

```bash
git push origin main 2>&1 | tail -5
```

**Step 3: Trigger deploy**

```bash
echo "=== Deploy at $(date +%H:%M:%S) ==="
./deploy.sh 2>&1 | tail -30
```

Expect final line: `=== DEPLOY COMPLETE ===`.

---

## Task P2-T10: Live E2E verification with real test card

**Step 1: HTTP status sweep**

```bash
for p in "/" "/music" "/merch" "/lotl" "/events/lotl-2026" "/subscribe" "/premium" "/account"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mystationlive.com${p}")
  printf "  %-38s %s\n" "$p" "$STATUS"
done
```

All 200. If not → Task 11 rollback.

**Step 2: New checkout API contract**

```bash
# Old contract should be rejected (or accepted with sensible defaults if backward-compat kept)
curl -sX POST https://mystationlive.com/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"premium","email":"test@test.com","commitment_agreed":true}' \
  -w "\nHTTP %{http_code}\n"
# Expect: 400 "amount_cents required"

# New contract returns a Stripe URL
curl -sX POST https://mystationlive.com/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"regression-test@example.com","amount_cents":700}' \
  -w "\nHTTP %{http_code}\n"
# Expect: 200 + { url: "https://checkout.stripe.com/..." }
```

**Step 3: Browser E2E with real test card**

1. Open `https://mystationlive.com/subscribe` in incognito
2. See PWYW form with $4.99 suggested
3. Enter email `regression-test@example.com` + $7 amount
4. Click "Continue at $7.00/mo"
5. Land on Stripe Checkout — verify "MyStation Supporter · $7.00 / month"
6. Complete with test card `4242 4242 4242 4242` any future expiry, any CVC, any ZIP
7. Land on `/subscribe/success` page
8. Verify Supabase `subscribers` table: new row with `monthly_amount_cents = 700`
9. Verify Stripe dashboard: subscription active, next charge $7.00
10. Visit `/vault` in that session — content unlocks (isSubscribed=true from webhook)
11. Repeat with `/premium` — verify default is $14.99

**Step 4: Grandfather sub test**

Log in as a known grandfathered sub. Verify:

- `/account` shows their actual monthly amount (from backfilled column)
- Nothing about their Stripe subscription changed
- They can still access gated content

**Step 5: Critical money paths still work**

```bash
# Merch checkout — smoke test only
# LOTL ticket buy — smoke test only
# MPF donation link — verify still redirects to mikepagefoundation.org
```

Any fail → Task P2-T11 rollback.

---

## Task P2-T11: Rollback (only if P2-T10 fails)

```bash
cd ~/MikePageEmpire/apps/mystation

# Instant Vercel rollback (30 sec)
vercel rollback --yes

# If still broken: revert the pivot commits
git revert <p2-t1-sha>..<p2-t7-sha> --no-edit
git push origin main
./deploy.sh

# DB rollback (rare — the ADD COLUMN is non-destructive so likely unneeded):
# ALTER TABLE public.subscribers DROP CONSTRAINT subscribers_monthly_amount_cents_range;
# (leave the column in place — no data corruption risk)
```

---

## Post-Ship Follow-Up (not in this plan)

- Metric review Sept 15 (30 days post-ship)
- Optional: `/account` amount-adjust button that opens Stripe portal directly
- Optional: "You've supported for X months, thanks!" badge on profile
- Optional: extract `<PWYWForm />` into a shared component if inlined during T5/T6
- Long-term: rip out `STRIPE_LINKS` and `TIERS` object once grandfathered subs churn out

---

## Rollback Cheat Sheet

**One commit went bad:** `git revert <sha> && git push && ./deploy.sh`
**Whole deploy went bad:** `vercel rollback --yes` (30 seconds)
**Whole pivot went bad:** `git revert <t1-sha>..<t7-sha> && git push && ./deploy.sh` (4 minutes)
**DB migration went bad:** column is non-destructive (nullable, additive). Only rollback the CHECK constraint if it blocks legitimate writes.

---

## Plan complete. Saved to `docs/plans/2026-08-16-mystation-pwyw-phase-1-implementation.md`.

Ready for execution once Mike approves the v2 design + this v2 plan.
