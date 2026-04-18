# MyStation Phone OTP + Premium Redesign — Design

**Date:** 2026-04-17
**Status:** Approved (sections 1–5)
**Owner:** Mike Page
**Scope:** Replace email auth with phone OTP, collapse fan tiers to Free + $4.99 Premium, make Premium month-to-month economics a 6-month commitment, keep Creator $14.99 mandatory, defer real free-tier limits by 6 months to grow the user base.

---

## Goals

1. **Zero-friction signup** — phone number → OTP → homepage with music playing. No email, no password, no onboarding.
2. **Grow first, monetize month 7** — during the first 6 months, free tier gets everything. Paywall infrastructure built but dormant.
3. **Premium earns itself back** — $4.99/mo with a 6-month commitment, unlocks free or discounted tickets to IDMG events (LOTL discount, showcases free), plus badge + early access.
4. **Creator tier unchanged** — $14.99/mo mandatory paywall already live, stays.
5. **Silent migration** — existing email users get prompted to link a phone on next login; their tier, Stripe, content, everything preserved. Legacy $9.99/$14.99 fan subs auto-downgrade to $4.99 Premium at next billing cycle with no announcement.

---

## Non-Goals

- International SMS (US/CA only for v1)
- Downloads (never — fan premium does not include offline)
- Grammy Nights tickets (excluded from Premium free/discount benefit, full price for everyone)
- Fan tiers beyond $4.99 (Premium $9.99 and Diamond $14.99 fan tiers are retired)

---

## Tier Structure (final)

| Plan | Price | Who | What |
|---|---|---|---|
| **Supporter** | Free | Anyone with a phone | Everything. Full audio, full albums, hi-fi, unlimited skips, follow creators, Live Chat, MyStationRadio, events (at full price). |
| **Premium** | $4.99/mo (6-month commitment) | Fans who want more | Supporter features + badge on profile + Supporters Wall + VIP Live Chat color + early access (2 weeks) + **free or discounted IDMG event tickets** |
| **Creator** | $14.99/mo mandatory | Anyone uploading content | Full Creator Station v2: uploads, merch, messages, analytics, videos, gallery, `/artist/[slug]` profile |

### Premium event perk defaults

| Event | Premium benefit |
|---|---|
| LOTL | 20% off |
| IDMG showcases / listening parties | FREE |
| MPF fundraisers | Admin's call |
| Grammy Nights | NOT included (full price) |

Admin chooses per event in MyTicketsLive event creation: `FREE` / `% off` / `$ off` / `None`.

---

## Monetization Phase Switch

**Env var:** `MYSTATION_MONETIZATION_MODE`

- `grow` (months 1–6): all feature gates return `true` for all users. No ads. No skip limits. No audio quality tiering. Premium is purely additive perks.
- `enforce` (month 7+): feature gates return `true` only for Premium+. Real limits on Supporter tier.

**Enforced behaviors when flipped to `enforce`:**
- Ads served to Supporter tier (every N tracks — number TBD)
- Skip limits on Supporter tier (count/hour — TBD)
- Hi-fi audio (320kbps) locked to Premium+; Supporter gets 128kbps standard
- Track-length / preview limits — TBD

All gate logic, ad-serving triggers, skip counters, and hi-fi selectors are built now as dormant code. Flipping one env var is the entire monetization rollout.

---

## Architecture

### Auth — Phone OTP

- **Provider:** Supabase Phone Auth, Twilio backend, US/CA only.
- **Schema:** `profiles.phone TEXT UNIQUE NOT NULL` (for new users). `profiles.email_auth_retired BOOLEAN DEFAULT FALSE` for migrated users.
- **New API routes:**
  - `POST /api/auth/send-otp` — accepts `{ phone }`, calls Supabase `signInWithOtp({ phone })`
  - `POST /api/auth/verify-otp` — accepts `{ phone, code }`, verifies via Supabase `verifyOtp`, creates/updates `profiles` row, sets `mystation-auth` cookie (same mechanism as today)
- **Old email login route** — returns `{ needs_phone_migration: true }` if user has `email_auth_retired = false` and no phone; otherwise returns 410 Gone.

### Homepage "Listen Free" flow

1. Unauthenticated visitor sees a prominent "Listen Free" CTA (no "sign up" language).
2. Click → modal: phone input + "Send Code" button.
3. OTP arrives via Twilio. iOS/Android SMS autofill. Or user types 6-digit code.
4. Verify → `auth.users` row created/fetched, session cookie set, `profiles` row upserted.
5. Redirect to `/` with a welcome track auto-playing from LOTL/IDMG catalog.
6. No mandatory onboarding. Optional "Complete your profile" slim banner appears later.

### Migration for existing email users

- On next login attempt, detect: `email_auth_retired = false` AND no phone → return `{ needs_phone_migration: true }`.
- UI: modal — "Add your phone to keep listening" with phone input + Send Code button.
- OTP verify → link phone to existing `auth.users` row, set `email_auth_retired = true`, preserve all tier / Stripe / creator profile / content data.
- After link, email login returns 410. Phone + OTP is the only way in.
- **Lost phone fallback:** magic link to email on file → re-link new phone via support flow.

### Legacy paid-fan subscription migration (silent)

- Stripe admin swap: archive `STRIPE_PRICE_PREMIUM` ($9.99 old) and `STRIPE_PRICE_DIAMOND` ($14.99 old fan tier).
- Rename `STRIPE_PRICE_SUPPORTER` ($4.99) → `STRIPE_PRICE_PREMIUM` in code + env.
- Script: loop over `subscribers` where `tier IN ('premium','diamond')` AND status `active` → call Stripe `subscription.update` to swap `items[].price` to the $4.99 price ID with `proration_behavior = 'none'` (bill $4.99 at next cycle).
- Stripe webhook `invoice.paid` maps old `premium` / `diamond` tier strings → unified `premium` tier on tier lookup.
- **No email to users. No announcement.** They pay less next cycle.
- Creator $14.99 tier (`STRIPE_PRICE_CREATOR`) untouched.

### Premium 6-month commitment

- New `/premium` signup page (or modal from any "Upgrade" CTA).
- Form: one checkbox — "I agree to a 6-month commitment ($29.94 total, billed as $4.99/mo) in exchange for free/discounted IDMG event tickets."
- Stripe: create subscription with `items[].price = STRIPE_PRICE_PREMIUM`, `cancel_at = now + 6 months` inverted — actually use a `subscription_schedule` with phase 1 locked for 6 cycles (cannot cancel early). After phase 1 ends, enters month-to-month.
- ToS captures the commitment; dispute liability is ours if user attempts chargeback.
- Business-logic block: `subscription.update` with `cancel_at_period_end = true` rejected until 6 paid cycles have completed.

### Cross-app integration — MyTicketsLive ↔ MyStation

- **New MyStation endpoint:** `GET /api/members/check-premium?phone={E.164}` → returns `{ is_premium: bool, commitment_ends_at: ISO8601 | null }`.
- Authenticated server-to-server by shared secret in header.
- **MyTicketsLive event schema change:** add `premium_benefit JSONB` column on `events` — `{ type: 'free' | 'percent_off' | 'fixed_off' | 'none', value?: number }`.
- **MyTicketsLive admin event-create UI:** dropdown to pick the Premium benefit.
- **MyTicketsLive checkout:** before pricing step, lookup user phone → MyStation `check-premium` → if Premium, apply per-event benefit (generate discount code, or issue free ticket).
- Non-Premium shoppers see banner: "Become Premium for $4.99/mo and save on this ticket + all IDMG events."

### Dormant feature gates

- Central helper `/src/lib/tiers.ts` → `hasAccess(userTier, requiredFeature)` extended to check `MYSTATION_MONETIZATION_MODE`. In `grow` mode, returns `true` regardless of `userTier`.
- Ad-serve route (`/api/ads/serve`) reads env var; if `grow`, returns 204 No Content (no ad).
- Skip-count middleware written but hooked behind env check; in `grow`, never triggers.
- Audio URL selector: build `tracks.audio_url_hifi` column + encoding pipeline (320kbps). Selector picks `audio_url_hifi` in `grow` mode for everyone; in `enforce` mode, Premium+ only.

---

## Build Scope

### Phase 1 (this week — MVP ship)
1. Phone OTP auth (Supabase Phone + Twilio, US/CA).
2. "Listen Free" homepage flow with autoplay redirect.
3. Legacy email migration prompt (`needs_phone_migration` detection).
4. Stripe price cleanup — archive old $9.99 + $14.99 fan prices, rename Supporter → Premium.
5. Auto-downgrade legacy paid subs to $4.99 Premium via Stripe `subscription.update` + webhook tier remap.

### Phase 2 (next week)
6. Premium checkout page with 6-month commitment ToS checkbox, Stripe subscription schedule.
7. Premium perks wiring — badge on profile, VIP Live Chat color, Supporters Wall page.
8. MyTicketsLive integration — `/api/members/check-premium`, per-event `premium_benefit` config, checkout auto-apply, non-Premium upsell banner.

### Phase 3 (build now, flip month 7)
9. Dormant feature gates (`MYSTATION_MONETIZATION_MODE` env var) on all monetization code paths.
10. Hi-fi encoding pipeline — re-encode catalog to 320kbps, `tracks.audio_url_hifi` column.
11. Skip counter + ad-serve trigger logic wired but dormant.

---

## Risks & Mitigations

- **SMS cost per signup.** Twilio US/CA is ~$0.008/msg. Dominant risk: bot floods. Mitigation: per-IP + per-phone-prefix rate limits at `/api/auth/send-otp` (3 requests / 15 min / IP; 1 OTP / phone / 60s). hCaptcha on the send-OTP form if abuse appears.
- **Lost phones / number recycling.** Fallback magic link to email on file for migrated users. New phone-only users: store a recovery email at month-1 onboarding prompt (optional).
- **Legacy auto-downgrade surprises users.** Mitigated by Stripe descriptor (new price shows on card statement); if support tickets spike, send retroactive email from Mike via Resend.
- **6-month commitment chargebacks.** ToS checkbox is the legal record; Stripe dispute evidence includes timestamp + IP + signed ToS payload. Chargeback = Premium revoked + ticket codes voided.
- **International visitors.** Non-US/CA phones rejected at `send-otp` with clear messaging ("MyStation is rolling out in the US/CA first — email us if you want early international access"). No silent failure.

---

## Testing / Verification

- End-to-end Phantom test: phone entry → OTP receipt (via Twilio test number) → verify → homepage autoplay.
- Migration test: create email-only test user → login → receive `needs_phone_migration` → complete link → next login with phone works.
- Stripe migration test: seed a test user on old $9.99 price → run downgrade script → verify next-cycle invoice = $4.99.
- Cross-app test: Premium user lands on MyTicketsLive event checkout → benefit auto-applies correctly for each benefit type (`free`, `percent_off`, `fixed_off`).
- Env flag test: toggle `MYSTATION_MONETIZATION_MODE = enforce` in staging → verify ads serve, skips throttle, hi-fi locks — then toggle back to `grow` for prod.

---

## Open Questions (resolve before Phase 3)

- Exact free-tier limits for `enforce` mode: ads-per-N-tracks, skips-per-hour, audio quality split. Defaults proposed earlier (every 4 tracks / 6 skips per hour / 128kbps) but these need Mike's final call in month 5-6 before flipping.
- Whether `MPF fundraisers` get a default Premium benefit or remain per-admin.

---

**Approved sections 1–5 in brainstorm thread 2026-04-17. Proceed to writing-plans skill for implementation plan.**
