# MyStation Creator Platform — Design Document

**Date:** 2026-03-13
**Status:** Approved by Mike

## Goal

Turn MyStation from a single-artist app into a multi-creator platform. Any creator (musician, podcaster, producer, DJ, content creator) pays $14.99/mo to get a profile, upload music, sell merch, and build their audience. Fans subscribe to MyStation (not individual creators). Creators keep 100% of merch revenue via Stripe Connect. Free users hear pre-roll audio ads + visual banner before every song; subscribers get ad-free.

## Revenue Model

| Stream | Amount | Goes To |
|--------|--------|---------|
| Creator fee | $14.99/mo each | MyStation |
| Fan subscription | $4.99-$14.99/mo each | MyStation |
| Pre-roll ads | Per impression | MyStation |
| Creator merch sales | Per sale | Creator (via Stripe Connect) |
| MyStation merch (IDMG/LOTL/MPF) | Per sale | MyStation |

## Creator Signup Flow

1. `/creators` landing page — pitch the platform value prop
2. Sign up form: name, email, password, artist/brand name, category (musician, podcaster, producer, DJ, content creator)
3. Pay $14.99/mo via Stripe (new subscription product on MyStation's Stripe account)
4. Connect bank account via Stripe Connect (for merch payouts)
5. Redirected to Creator Dashboard at `/dashboard`
6. Profile page goes live at `/artist/[slug]`

No approval process. Pay and you're in.

## Creator Dashboard (`/dashboard`)

- **Upload Music** — tracks uploaded to R2, appear on creator profile + MyStation catalog
- **Merch** — upload designs, pick Printify products, set prices. MyStation handles fulfillment.
- **Analytics** — plays, top tracks, fan count, merch sales, revenue
- **Profile Settings** — bio, avatar, social links, genre tags

## Creator Profile (`/artist/[slug]`)

Public page showing:
- Creator name, avatar, bio, genre tags
- Their music catalog (playable)
- Their merch store
- Social links
- Follow button (fans can follow to get notified of new releases)

## Merch & Stripe Connect

- Creator connects bank account via Stripe Connect during onboarding
- When fan buys creator's merch: order goes to Printify/Printful (MyStation's accounts), fulfillment handled by MyStation, payment goes to creator's connected Stripe account
- MyStation's own merch (IDMG, LOTL, MPF) still routes to Mercury — unchanged
- Creator just uploads designs and sets prices. Zero ops burden on them.

## Pre-Roll Ad System

- **Trigger:** Free (non-subscribed) user hits play on any track
- **Experience:** 15-30 sec audio ad plays + clickable visual banner displayed on screen
- **Subscriber experience:** No ads. Song plays immediately.
- **Phase 1:** House ads only — LOTL tickets, merch drops, new releases, creator signup promos
- **Phase 2:** Paid advertiser spots (when traffic justifies it)
- **Admin panel:** Upload audio clip (MP3/M4A) + banner image (PNG/JPG) + click-through URL + scheduling

## Fan Subscription (unchanged)

- Fans subscribe to MyStation ($4.99/$9.99/$14.99 per month)
- Gets: ad-free listening, full catalog access, all creator content
- All subscription revenue goes to MyStation's Stripe → Mercury
- Existing subscription system, tiers, cookies, webhooks — all untouched

## New Components to Build

| Component | Type | Description |
|-----------|------|-------------|
| `/creators` | Page | Landing page — creator signup pitch + CTA |
| `/creators/signup` | Page | Signup form + Stripe payment |
| `/creators/onboarding` | Page | Stripe Connect bank account linking |
| `/dashboard` | Page | Creator control panel (music, merch, analytics, settings) |
| `/dashboard/upload` | Page | Music upload interface |
| `/dashboard/merch` | Page | Merch design + product creation |
| `/dashboard/analytics` | Page | Creator-specific analytics |
| `/dashboard/settings` | Page | Profile editing |
| `/artist/[slug]` | Page | Public creator profile |
| `/api/creators/signup` | API | Create creator account + Stripe subscription |
| `/api/creators/connect` | API | Stripe Connect onboarding link generation |
| `/api/creators/upload` | API | Music file upload to R2 |
| `/api/creators/merch` | API | Creator merch product CRUD via Printify |
| `/api/creators/analytics` | API | Creator-specific play/sales data |
| `/api/ads/serve` | API | Return next ad (audio URL + banner + click URL) |
| `/api/ads/impression` | API | Track ad impressions + clicks |
| `/api/ads/admin` | API | CRUD for ad inventory |
| `AdPreRoll` component | UI | Audio player integration — plays ad before song for free users |
| `AdBanner` component | UI | Visual banner displayed during ad playback |
| Admin: `/admin/ads` | Page | Ad inventory management |
| Admin: `/admin/creators` | Page | View/manage all creators |

## Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `creators` | Creator accounts (user_id, slug, name, category, stripe_connect_id, subscription_status, created_at) |
| `creator_tracks` | Music uploaded by creators (creator_id, title, audio_url, duration, plays, created_at) |
| `creator_merch` | Merch products by creators (creator_id, printify_product_id, title, price, image_url) |
| `ads` | Ad inventory (audio_url, banner_url, click_url, active, impressions, clicks, start_date, end_date) |
| `ad_impressions` | Ad play tracking (ad_id, user_ip_hash, played_at, clicked) |

## Stripe Products

| Product | Price | Type | Purpose |
|---------|-------|------|---------|
| MyStation Creator | $14.99/mo | Subscription | Creator platform access |
| (Existing fan tiers unchanged) | $4.99-$14.99/mo | Subscription | Fan ad-free access |

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Creator approval | None — pay and you're in | $14.99 filters non-serious. No bottleneck. |
| Revenue split | Creators keep 100% merch | Simple. MyStation makes money on creator fees + fan subs + ads. |
| Merch fulfillment | MyStation's Printify/Printful | Zero ops for creators. They just design. |
| Stripe Connect | For merch payouts only | Fan subs go to MyStation. Only merch needs routing to creators. |
| Ad type | Audio + visual banner | Higher CPM, drives clicks, proven model (Spotify). |
| Ad phase 1 | House ads only | Free revenue from day 1. Paid advertisers later. |
