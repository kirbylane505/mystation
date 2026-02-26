# Subscription Upgrade — Full Architecture Redesign

## Problem
Current system uses Stripe Payment Links — no programmatic control. Can't upgrade/downgrade tiers, can't enforce feature gates, no admin tools. Every subscriber gets everything regardless of tier.

## Solution
Replace Payment Links with Stripe Checkout Sessions backed by real Products/Prices. Enforce tier-based feature gates. In-app upgrade/downgrade with proration. Full admin control.

## Architecture

### Stripe Products & Prices
Create 3 Products in Stripe with monthly recurring Prices:
- **Supporter** — $4.99/mo (30-day free trial)
- **Premium** — $9.99/mo (30-day free trial)
- **Diamond** — $14.99/mo (30-day free trial)

Store Price IDs in env vars:
```
STRIPE_PRICE_SUPPORTER=price_xxx
STRIPE_PRICE_PREMIUM=price_xxx
STRIPE_PRICE_DIAMOND=price_xxx
```

### API Routes (New/Modified)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscription/checkout` | POST | Create Stripe Checkout Session for new subscription |
| `/api/subscription/upgrade` | POST | Change tier (prorate) via Stripe Subscriptions API |
| `/api/subscription/status` | GET | Return current tier, status, renewal date from Supabase |
| `/api/subscription/portal` | POST | Open Stripe Customer Portal (keep existing) |
| `/api/subscription/subscribe` | POST | Keep existing — LOTL slot tracking + subscriber count |
| `/api/subscription/session` | POST | Keep existing — sets httpOnly cookie |

### Checkout Flow (New)
```
1. User selects tier on /subscribe
2. POST /api/subscription/checkout { tier: 'premium', email }
3. Server creates Stripe Checkout Session:
   - price: STRIPE_PRICE_PREMIUM
   - mode: 'subscription'
   - trial_period_days: 30
   - success_url: /subscribe/success?session_id={CHECKOUT_SESSION_ID}&tier={tier}
   - cancel_url: /subscribe
   - customer_email: email
   - metadata: { tier, source: 'mystation' }
4. Return { url: session.url }
5. Client redirects to Stripe Checkout
6. On success → /subscribe/success handles activation (existing flow)
7. Webhook fires → updates subscribers table with tier + stripe_customer_id + stripe_subscription_id
```

### Upgrade/Downgrade Flow (New)
```
1. User on /account clicks "Upgrade to Diamond"
2. POST /api/subscription/upgrade { newTier: 'diamond' }
3. Server:
   a. Lookup subscriber by email → get stripe_subscription_id
   b. Retrieve subscription from Stripe
   c. Update subscription item to new Price ID
   d. Stripe auto-prorates (immediate billing)
4. Webhook fires: customer.subscription.updated
   → Update subscribers.tier in Supabase
   → Send tier change email
5. Client refreshes → new tier active immediately
```

### Supabase Schema Changes
Add columns to `subscribers` table:
```sql
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
```

### Feature Gates (Tier Enforcement)
```
SUPPORTER ($4.99):
  - Unlimited streaming
  - Background playback
  - Comments
  - Fan Wall
  - Playlists

PREMIUM ($9.99) = Supporter +:
  - Spotify Search (100M+ songs)
  - DJ Turntables
  - Fan Zone
  - Early access to drops

DIAMOND ($14.99) = Premium +:
  - Create Your Station (upload, sell, keep 100%)
  - Full Vault access
  - Grammy Nights collection
  - 10% merch discount
  - Diamond badge
  - Kickback Lounge tournaments
```

Gate implementation: `getTierLevel()` utility function
- `diamond` = 3, `premium` = 2, `supporter` = 1, `none` = 0
- Components check: `if (tierLevel >= REQUIRED_LEVEL)` show feature, else show upgrade CTA

### Webhook Updates
Enhance `stripe/webhook/route.js`:
- `checkout.session.completed` → store `stripe_customer_id`, `stripe_subscription_id`, `tier` from metadata
- `customer.subscription.updated` → update `tier`, `current_period_end`, `cancel_at_period_end`
- `customer.subscription.deleted` → set `status: 'canceled'`, clear tier
- `invoice.paid` → extend `current_period_end`

### Subscribe Page Changes
- Keep 3-tier card layout (existing, LOCKED)
- Replace Payment Link redirects with POST to `/api/subscription/checkout`
- Add "Current Plan" indicator for existing subscribers
- Add "Upgrade" / "Downgrade" buttons between tiers

### Account Page Changes
- Show current tier with badge (Supporter/Premium/Diamond)
- Show renewal date, trial status
- Upgrade CTA if not Diamond
- "Manage Subscription" → Stripe Portal (keep existing)
- Cancel option with confirmation

### Files Modified
1. `src/app/api/subscription/checkout/route.js` — NEW
2. `src/app/api/subscription/upgrade/route.js` — NEW
3. `src/app/api/subscription/status/route.js` — NEW
4. `src/app/api/stripe/webhook/route.js` — MODIFY (add tier tracking)
5. `src/app/subscribe/page.jsx` — MODIFY (Checkout Sessions, not Payment Links)
6. `src/app/subscribe/success/page.jsx` — MODIFY (handle session_id from Checkout)
7. `src/app/account/page.jsx` — MODIFY (tier display, upgrade CTAs)
8. `src/lib/tiers.js` — NEW (tier config, feature gates, utility functions)
9. `src/store/playerStore.js` — MODIFY (add tierLevel to user state)

### What We DON'T Change
- Player (LOCKED)
- Cookie system (365-day, HMAC — LOCKED)
- LOTL promo slot tracking (LOCKED)
- Email notifications (LOCKED)
- Webhook isolation for MyTicketsLive (LOCKED)
- 30-day free trial (LOCKED)

### Migration Plan
1. Create Stripe Products/Prices (one-time, via API)
2. Deploy new API routes + tier lib
3. Update subscribe page to use Checkout Sessions
4. Update webhook to track tiers
5. Add feature gates progressively
6. Existing subscribers keep their tier (backfill from Stripe)
