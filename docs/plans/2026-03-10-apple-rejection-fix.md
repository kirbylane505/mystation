# Apple App Store Rejection Fix — Path A + 30-Second Previews

## Date: March 10, 2026
## Status: Building

## Rejection Issues
1. **4.0.0 Design** — UI crowded on iPad Air 11-inch
2. **3.1.1 IAP** — Stripe checkout + access codes bypass Apple IAP
3. **2.1(b) Completeness** — Subscription references but no IAP products

## Solution
- 30-second previews for ALL tracks (non-subscribers hear 30s, then fade + CTA)
- Remove Stripe checkout from iOS app (keep on web)
- Remove access code entry from iOS app (keep on web)
- Add iPad-responsive layout fixes
- Direct iOS users to mystationlive.com for subscriptions

## Files Modified
- `src/lib/native.js` — export isNative for components
- `src/store/playerStore.js` — 30-second preview logic
- `src/components/AudioPlayer.jsx` — preview timer + fade
- `src/components/SubscribeModal.jsx` — iOS mode (no Stripe/codes)
- `src/components/AccountWall.jsx` — iOS mode (no access codes)
- iPad CSS fixes in globals.css or component-level

## Behavior Matrix
| Feature | Web | iOS App |
|---------|-----|---------|
| Free tracks (500, 501) | Full play | Full play |
| Gated tracks | Subscribe modal on tap | 30-sec preview → "Subscribe at mystationlive.com" |
| Subscribe button | Stripe checkout links | "Subscribe at mystationlive.com" |
| Access codes | Available | Hidden |
| Merch checkout | Stripe | Stripe (physical goods = allowed) |
| iPad layout | N/A | Responsive grid |
