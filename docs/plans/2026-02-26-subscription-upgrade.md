# Subscription Upgrade — Full Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Stripe Payment Links with Checkout Sessions, enforce tier-based feature gates, enable in-app upgrade/downgrade, and store Stripe IDs for full subscription lifecycle management.

**Architecture:** Server-created Stripe Checkout Sessions using real Products/Prices. Webhook stores stripe_customer_id + stripe_subscription_id + tier in Supabase subscribers table. Tier utility lib provides feature gating. Account page shows upgrade CTAs.

**Tech Stack:** Next.js 15 App Router, Stripe Subscriptions API, Supabase Postgres, Zustand

---

### Task 1: Create Stripe Products & Prices + Tier Config Library

**Files:**
- Create: `src/lib/tiers.js`
- No test file (config-only, validated by build)

**Step 1: Create Stripe Products & Prices via API**

Run this one-time script to create the 3 products in Stripe:

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation

# Source env vars
source .env.local 2>/dev/null || true

# Create Products + Prices via Stripe API
node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  // Supporter
  const supporter = await stripe.products.create({ name: 'MyStation Supporter', metadata: { tier: 'supporter' } });
  const supporterPrice = await stripe.prices.create({
    product: supporter.id,
    unit_amount: 499,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'supporter' },
  });
  console.log('SUPPORTER:', supporter.id, supporterPrice.id);

  // Premium
  const premium = await stripe.products.create({ name: 'MyStation Premium', metadata: { tier: 'premium' } });
  const premiumPrice = await stripe.prices.create({
    product: premium.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'premium' },
  });
  console.log('PREMIUM:', premium.id, premiumPrice.id);

  // Diamond
  const diamond = await stripe.products.create({ name: 'MyStation Diamond', metadata: { tier: 'diamond' } });
  const diamondPrice = await stripe.prices.create({
    product: diamond.id,
    unit_amount: 1499,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier: 'diamond' },
  });
  console.log('DIAMOND:', diamond.id, diamondPrice.id);
})();
"
```

Save the output Price IDs. Add to `.env.local` and Vercel:
```
STRIPE_PRICE_SUPPORTER=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_DIAMOND=price_xxx
```

**Step 2: Create tier config library**

Create `src/lib/tiers.js`:

```javascript
/**
 * MYSTATION — Tier Configuration & Feature Gates
 * Single source of truth for subscription tiers.
 */

// Tier levels (higher = more features)
export const TIER_LEVEL = {
  free: 0,
  supporter: 1,
  regular: 1, // alias
  premium: 2,
  diamond: 3,
};

// Price IDs — set in env vars after creating Stripe Products
export const TIER_PRICES = {
  supporter: process.env.STRIPE_PRICE_SUPPORTER,
  premium: process.env.STRIPE_PRICE_PREMIUM,
  diamond: process.env.STRIPE_PRICE_DIAMOND,
};

// Reverse lookup: price_id → tier name
export function tierFromPriceId(priceId) {
  for (const [tier, id] of Object.entries(TIER_PRICES)) {
    if (id === priceId) return tier;
  }
  return 'supporter'; // fallback
}

// Tier display info
export const TIER_INFO = {
  supporter: { name: 'Supporter', price: 4.99, color: 'blue', icon: 'Headphones' },
  premium: { name: 'Premium', price: 9.99, color: 'purple', icon: 'Star' },
  diamond: { name: 'Diamond', price: 14.99, color: 'amber', icon: 'Gem' },
};

// Feature gate: does this tier have access?
export function hasAccess(userTier, requiredTier) {
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0);
}

// Get numeric level
export function getTierLevel(tier) {
  return TIER_LEVEL[tier] || 0;
}

// What tier can upgrade to?
export function getUpgradeOptions(currentTier) {
  const level = getTierLevel(currentTier);
  const options = [];
  if (level < 1) options.push('supporter');
  if (level < 2) options.push('premium');
  if (level < 3) options.push('diamond');
  return options;
}
```

**Step 3: Verify build compiles**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
npx next build 2>&1 | tail -5
```

Expected: Build succeeds (new file is server-only lib, no imports yet)

**Step 4: Commit**

```bash
git add src/lib/tiers.js
git commit -m "feat: add tier config library with feature gates and Stripe Price ID mapping"
```

---

### Task 2: Add Stripe Columns to Supabase Subscribers Table

**Step 1: Run migration SQL**

Execute in Supabase SQL Editor or via CLI:

```sql
-- Add Stripe tracking columns to subscribers table
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_sub ON subscribers(stripe_subscription_id);
```

**Step 2: Verify columns exist**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'subscribers' ORDER BY ordinal_position;
```

Expected: See `stripe_customer_id`, `stripe_subscription_id`, `current_period_end`, `cancel_at_period_end` in list.

---

### Task 3: Create Checkout Session API Route

**Files:**
- Create: `src/app/api/subscription/checkout/route.js`

**Step 1: Create the route**

```javascript
/**
 * MYSTATION — Stripe Checkout Session Creator
 * Replaces Payment Links with server-created sessions for full control.
 * Supports new subscriptions with 30-day free trial.
 */

import { NextResponse } from 'next/server';
import { TIER_PRICES, TIER_INFO } from '@/lib/tiers';

export async function POST(request) {
  try {
    const { tier, email } = await request.json();

    // Validate tier
    if (!tier || !TIER_PRICES[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: supporter, premium, or diamond' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const priceId = TIER_PRICES[tier];
    if (!priceId) {
      console.error(`Missing STRIPE_PRICE for tier: ${tier}`);
      return NextResponse.json(
        { error: 'Subscription not configured' },
        { status: 500 }
      );
    }

    // Check if customer already exists in Stripe
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;

      // Check if they already have an active subscription
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });
      if (subs.data.length > 0) {
        // Already subscribed — redirect to upgrade instead
        return NextResponse.json({
          error: 'Already subscribed. Use upgrade to change tier.',
          alreadySubscribed: true,
          currentTier: subs.data[0].metadata?.tier || 'supporter',
        }, { status: 409 });
      }
    }

    // Create Checkout Session
    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://mystationlive.com/subscribe/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: 'https://mystationlive.com/subscribe',
      subscription_data: {
        trial_period_days: 30,
        metadata: { tier, source: 'mystation' },
      },
      metadata: { tier, source: 'mystation' },
      allow_promotion_codes: true,
    };

    // Attach existing customer or pre-fill email
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add "src/app/api/subscription/checkout/route.js"
git commit -m "feat: add Stripe Checkout Session API — replaces Payment Links"
```

---

### Task 4: Create Upgrade/Downgrade API Route

**Files:**
- Create: `src/app/api/subscription/upgrade/route.js`

**Step 1: Create the route**

```javascript
/**
 * MYSTATION — Subscription Upgrade/Downgrade
 * Changes tier by swapping Stripe subscription price with proration.
 */

import { NextResponse } from 'next/server';
import { TIER_PRICES, getTierLevel, tierFromPriceId } from '@/lib/tiers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  try {
    const { email, newTier } = await request.json();

    if (!email || !newTier || !TIER_PRICES[newTier]) {
      return NextResponse.json(
        { error: 'Email and valid tier required' },
        { status: 400 }
      );
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();

    // Look up subscriber
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('stripe_subscription_id, stripe_customer_id, tier')
      .eq('email', email.toLowerCase())
      .single();

    if (!subscriber?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Don't allow same-tier "upgrade"
    if (subscriber.tier === newTier) {
      return NextResponse.json(
        { error: 'Already on this tier' },
        { status: 400 }
      );
    }

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(subscriber.stripe_subscription_id);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      );
    }

    const newPriceId = TIER_PRICES[newTier];

    // Update the subscription item to new price
    const updated = await stripe.subscriptions.update(subscriber.stripe_subscription_id, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
      metadata: { tier: newTier, source: 'mystation' },
    });

    // Update Supabase immediately (webhook will also fire as backup)
    await supabase
      .from('subscribers')
      .update({
        tier: newTier,
        current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
      })
      .eq('email', email.toLowerCase());

    const isUpgrade = getTierLevel(newTier) > getTierLevel(subscriber.tier);

    return NextResponse.json({
      success: true,
      previousTier: subscriber.tier,
      newTier,
      action: isUpgrade ? 'upgraded' : 'downgraded',
      currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    return NextResponse.json(
      { error: 'Failed to change subscription' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add "src/app/api/subscription/upgrade/route.js"
git commit -m "feat: add subscription upgrade/downgrade API with Stripe proration"
```

---

### Task 5: Create Subscription Status API Route

**Files:**
- Create: `src/app/api/subscription/status/route.js`

**Step 1: Create the route**

```javascript
/**
 * MYSTATION — Subscription Status
 * Returns current tier, status, renewal date from Supabase.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ tier: 'free', status: 'none' });
    }

    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('tier, status, current_period_end, cancel_at_period_end, stripe_customer_id, subscriber_number, created_at')
      .eq('email', email.toLowerCase())
      .single();

    if (!subscriber || subscriber.status !== 'active') {
      return NextResponse.json({
        tier: 'free',
        status: subscriber?.status || 'none',
        isSubscribed: false,
      });
    }

    return NextResponse.json({
      tier: subscriber.tier || 'supporter',
      status: subscriber.status,
      isSubscribed: true,
      currentPeriodEnd: subscriber.current_period_end,
      cancelAtPeriodEnd: subscriber.cancel_at_period_end || false,
      subscriberNumber: subscriber.subscriber_number,
      memberSince: subscriber.created_at,
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add "src/app/api/subscription/status/route.js"
git commit -m "feat: add subscription status API — returns tier, renewal date, cancel state"
```

---

### Task 6: Update Stripe Webhook — Store Stripe IDs + Track Tier Changes

**Files:**
- Modify: `src/app/api/stripe/webhook/route.js`

**CRITICAL: Do NOT break existing merch order flow. Only ADD subscription-specific handling.**

**Step 1: Add subscription detection to handleCheckoutCompleted**

After the MyTicketsLive skip guard (line 100), add subscription session detection:

```javascript
  // --- SUBSCRIPTION CHECKOUT ---
  // If mode is 'subscription', handle subscriber registration
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, stripe);
    return; // Don't process as merch order
  }
```

**Step 2: Add handleSubscriptionCheckout function**

Add before `handleInvoicePaid`:

```javascript
/**
 * Handle subscription checkout — store Stripe IDs, register subscriber
 */
async function handleSubscriptionCheckout(session, stripe) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  if (!customerEmail) {
    console.log('Subscription checkout: no email found');
    return;
  }

  const email = customerEmail.toLowerCase();
  const tier = session.metadata?.tier || 'supporter';
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(`New subscription: ${email} → ${tier} (customer: ${customerId}, sub: ${subscriptionId})`);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Get subscription details for period end
    let currentPeriodEnd = null;
    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
    }

    // Count for subscriber number
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });
    const subscriberNumber = (count || 0) + 1;

    // Upsert subscriber with Stripe IDs
    await supabase.from('subscribers').upsert({
      email,
      status: 'active',
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      subscriber_number: subscriberNumber,
      created_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    // Also update user_trials
    await supabase.from('user_trials').upsert({
      email,
      stripe_sub_active: true,
      purchased_sub_until: currentPeriodEnd,
    }, { onConflict: 'email' });

    // Alert Mike + tag in Kit
    sendNewSignupAlert({
      customerName: session.customer_details?.name || email.split('@')[0],
      customerEmail: email,
      subscriberNumber,
      isFreeSlot: subscriberNumber <= 250,
      tier,
    }).catch(() => {});

    tagSubscriber(email, `subscriber-${tier}`).catch(() => {});

  } catch (err) {
    console.error('Subscription checkout handler error:', err);
  }
}
```

**Step 3: Update handleSubscriptionUpdated to track tier changes**

Replace the existing `handleSubscriptionUpdated` function:

```javascript
/**
 * Handle customer.subscription.updated — tier changes, cancellation scheduling
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id, 'status:', subscription.status);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Find subscriber by stripe_subscription_id
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('email, tier')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!subscriber) {
      console.log('subscription.updated: No subscriber found for sub:', subscription.id);
      return;
    }

    // Detect new tier from price
    const { tierFromPriceId } = await import('@/lib/tiers');
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const newTier = priceId ? tierFromPriceId(priceId) : subscriber.tier;

    await supabase
      .from('subscribers')
      .update({
        tier: newTier,
        status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end || false,
      })
      .eq('stripe_subscription_id', subscription.id);

    if (newTier !== subscriber.tier) {
      console.log(`Tier changed: ${subscriber.email} ${subscriber.tier} → ${newTier}`);
    }

  } catch (err) {
    console.error('subscription.updated handler error:', err);
  }
}
```

**Step 4: Update handleSubscriptionCanceled to use stripe_subscription_id**

Replace existing function:

```javascript
async function handleSubscriptionCanceled(subscription) {
  console.log('Subscription canceled:', subscription.id);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Find by stripe_subscription_id first, fall back to metadata email
    let email;
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('email')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    email = subscriber?.email || subscription.metadata?.email;
    if (!email) {
      console.log('subscription.deleted: Cannot find subscriber for:', subscription.id);
      return;
    }

    email = email.toLowerCase();
    console.log('Subscription canceled for:', email);

    await supabase
      .from('subscribers')
      .update({ status: 'canceled', cancel_at_period_end: false })
      .eq('email', email);

    await supabase
      .from('user_trials')
      .update({ stripe_sub_active: false })
      .eq('email', email);

    // Send cancel alert to Mike
    sendCancelAlert({ customerEmail: email }).catch(() => {});

  } catch (err) {
    console.error('subscription.deleted handler error:', err);
  }
}
```

**Step 5: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add src/app/api/stripe/webhook/route.js
git commit -m "feat: webhook stores Stripe IDs, tracks tier changes, handles subscription checkout"
```

---

### Task 7: Update Subscribe Page — Checkout Sessions Instead of Payment Links

**Files:**
- Modify: `src/app/subscribe/page.jsx` (lines 12-16, ~290-310)

**Step 1: Replace STRIPE_LINKS with handleSubscribe function**

Remove lines 12-16 (STRIPE_LINKS constant). Replace the subscribe button handler to call the new checkout API:

The button click handler in each tier card currently does:
```javascript
localStorage.setItem('mystation-selected-tier', tier.id);
window.location.href = STRIPE_LINKS[tier.id];
```

Replace with:
```javascript
const handleSubscribe = async (tierId) => {
  setSubscribing(tierId);
  try {
    // Get email from store or prompt
    const email = useUserStore.getState().email || localStorage.getItem('mystation-email') || '';

    if (!email) {
      // Show email input — set state to prompt
      setNeedsEmail(tierId);
      setSubscribing(null);
      return;
    }

    localStorage.setItem('mystation-selected-tier', tierId);

    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: tierId, email }),
    });
    const data = await res.json();

    if (data.alreadySubscribed) {
      // Already subscribed — redirect to account to upgrade
      window.location.href = '/account';
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error('No checkout URL returned:', data);
    }
  } catch (err) {
    console.error('Checkout error:', err);
  } finally {
    setSubscribing(null);
  }
};
```

Add state vars at top of component:
```javascript
const [subscribing, setSubscribing] = useState(null);
const [needsEmail, setNeedsEmail] = useState(null);
const [emailInput, setEmailInput] = useState('');
```

Add email prompt modal for when no email is stored (simple inline input above the subscribe button when `needsEmail` is set).

**Step 2: Update subscribe button in each tier card**

Replace the `<a href={STRIPE_LINKS[tier.id]}>` with:
```jsx
<button
  onClick={() => handleSubscribe(tier.id)}
  disabled={subscribing === tier.id}
  className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${tier.btnClass} ...`}
>
  {subscribing === tier.id ? 'Loading...' : `Subscribe — $${tier.price}/mo`}
</button>
```

**Step 3: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add src/app/subscribe/page.jsx
git commit -m "feat: subscribe page uses Checkout Sessions instead of Payment Links"
```

---

### Task 8: Update Subscribe Success Page — Handle session_id from Checkout

**Files:**
- Modify: `src/app/subscribe/success/page.jsx` (lines 78-112)

**Step 1: Update useEffect to read tier from URL params**

The new Checkout Session redirects with `?session_id=xxx&tier=premium`. Update:

```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tierFromUrl = params.get('tier');
  const sessionId = params.get('session_id');
  const selectedTier = tierFromUrl || localStorage.getItem('mystation-selected-tier') || 'regular';
  setTier(selectedTier);

  // Set server-side subscription session cookie
  fetch('/api/subscription/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'activate', tier: selectedTier }),
  }).catch((err) => console.error('Session cookie failed:', err));

  // Get email from session if available, or use stored email
  const storedEmail = localStorage.getItem('mystation-email') || useUserStore.getState().email || '';

  // Register subscriber with backend
  if (storedEmail) {
    fetch('/api/subscription/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: storedEmail, tier: selectedTier }),
    }).catch(() => {});
  }

  // Mark user as subscribed in client store
  subscribe(storedEmail || 'subscriber@mystation.com', selectedTier);
  localStorage.removeItem('mystation-selected-tier');

  setTimeout(() => setShowContent(true), 300);

  if (selectedTier !== 'diamond') {
    const timer = setTimeout(() => {
      const savedPendingTrack = localStorage.getItem('mystation-pending-track');
      if (savedPendingTrack) {
        try {
          const track = JSON.parse(savedPendingTrack);
          setTrack(track);
          setIsPlaying(true);
        } catch {}
        localStorage.removeItem('mystation-pending-track');
      }
      router.push('/');
    }, 10000);
    return () => clearTimeout(timer);
  }
}, []);
```

**Step 2: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add src/app/subscribe/success/page.jsx
git commit -m "feat: success page reads tier from URL params (Checkout Session redirect)"
```

---

### Task 9: Update Account Page — Tier Display + Upgrade CTAs

**Files:**
- Modify: `src/app/account/page.jsx`

**Step 1: Add tier-aware UI with upgrade buttons**

Replace the account page with enhanced version that:
- Shows current tier with proper badge (Supporter blue, Premium purple, Diamond amber)
- Shows renewal date and cancel status
- Shows "Upgrade to Premium" / "Upgrade to Diamond" buttons for lower tiers
- Manage Subscription still goes to Stripe Portal
- Replace all Payment Link fallback URLs with `/subscribe`

Key changes to the component:
- Import `TIER_INFO, getUpgradeOptions` from `@/lib/tiers` (client-side needs separate config)
- Add `handleUpgrade(newTier)` function that calls `/api/subscription/upgrade`
- Add upgrade cards below current plan display
- Replace all `buy.stripe.com` URLs with `/subscribe`

**Step 2: Replace Payment Link fallbacks**

In `handleManageSubscription` (lines 21, 40, 43): Replace:
```javascript
window.location.href = 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00';
```
With:
```javascript
window.location.href = '/subscribe';
```

**Step 3: Add upgrade handler**

```javascript
const handleUpgrade = async (newTier) => {
  const email = useUserStore.getState().email;
  if (!email) {
    window.location.href = '/subscribe';
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newTier }),
    });
    const data = await res.json();
    if (data.success) {
      // Update local store
      useUserStore.getState().subscribe(email, newTier);
      // Refresh page to show new tier
      window.location.reload();
    } else {
      alert(data.error || 'Upgrade failed');
    }
  } catch (err) {
    console.error('Upgrade error:', err);
  } finally {
    setLoading(false);
  }
};
```

**Step 4: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add src/app/account/page.jsx
git commit -m "feat: account page shows tier badge, renewal date, upgrade CTAs"
```

---

### Task 10: Update Subscribe Route — Accept Tier Parameter

**Files:**
- Modify: `src/app/api/subscription/subscribe/route.js` (line 69-76)

**Step 1: Accept tier from request body**

Change line 20:
```javascript
const { email } = await request.json();
```
To:
```javascript
const { email, tier } = await request.json();
```

Change line 72 in the upsert:
```javascript
tier: 'supporter',
```
To:
```javascript
tier: tier || 'supporter',
```

Remove all `stripeUrl`, `premiumUrl`, `diamondUrl` from responses (lines 38-41, 96-98) — these are dead Payment Link URLs.

**Step 2: Verify build + Commit**

```bash
npx next build 2>&1 | tail -5
git add src/app/api/subscription/subscribe/route.js
git commit -m "feat: subscribe API accepts tier parameter, removes Payment Link URLs"
```

---

### Task 11: Add Env Vars to Vercel + Final Deploy

**Step 1: Add Price IDs to Vercel**

```bash
cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation
printf '%s' 'price_xxx' | vercel env add STRIPE_PRICE_SUPPORTER production
printf '%s' 'price_xxx' | vercel env add STRIPE_PRICE_PREMIUM production
printf '%s' 'price_xxx' | vercel env add STRIPE_PRICE_DIAMOND production
```

(Replace `price_xxx` with actual Price IDs from Task 1)

**Step 2: Deploy**

```bash
vercel --prod
```

**Step 3: Verify all pages return 200**

```bash
for p in / /music /search /merch /subscribe /account /events; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```

**Step 4: Test checkout flow**

1. Navigate to /subscribe
2. Select a tier
3. Verify redirect to Stripe Checkout (not Payment Link)
4. Verify success page reads tier from URL params

---

## Execution Order

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Tier config lib + Stripe Products | None |
| 2 | Supabase schema migration | None |
| 3 | Checkout Session API | Task 1 |
| 4 | Upgrade/Downgrade API | Task 1, 2 |
| 5 | Status API | Task 2 |
| 6 | Webhook updates | Task 1, 2 |
| 7 | Subscribe page UI | Task 3 |
| 8 | Success page update | Task 7 |
| 9 | Account page upgrade | Task 4, 5 |
| 10 | Subscribe API tier param | None |
| 11 | Env vars + Deploy | All tasks |

Tasks 1, 2, and 10 can run in parallel.
Tasks 3, 4, 5 can run in parallel after 1+2.
Tasks 7, 8, 9 depend on their respective APIs.
Task 6 (webhook) is the most critical — test carefully.
Task 11 is always last.
