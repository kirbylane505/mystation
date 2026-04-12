# Deep Analytics Dashboard — Design Doc
**Date:** 2026-03-14
**Status:** Approved

## Sections
1. **Revenue (All-Time)** — Stripe live pull, breakdown by type
2. **Listener Intelligence** — Match ip_hash to subscriber emails, show who's listening
3. **Deep Location** — City + State + Country, top 25 cities
4. **Device Intelligence** — Parse UA for browser, OS, device model, PWA/CarPlay detection
5. **Real-Time Feed** — Last 50 events with track/location/device/time

## Technical
- New API: `/api/admin/deep-analytics` — pulls Stripe + Supabase in one call
- New page: Enhanced `/admin/analytics` page with 5 sections
- Subscriber matching: Cross-reference analytics_events.ip_hash with subscriber session data
- UA parsing: Server-side regex parsing of user_agent field
- Stripe: Live balance + charges pull via API
