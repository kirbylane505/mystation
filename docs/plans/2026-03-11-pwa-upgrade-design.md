---

# MyStation PWA Upgrade — Design Document
## Date: 2026-03-11 | Status: APPROVED

---

## Overview

Convert MyStation from Capacitor iOS app (rejected by Apple) to a full Progressive Web App. Users install directly from the browser — no App Store needed. 100% of subscription revenue stays with the Empire.

## Current State

MyStation already has PWA foundations:
- manifest.json (standalone mode, 3 icon sizes)
- Service worker v5 (network-first, offline fallback)
- 15 icon sizes in /public/icons/
- Apple meta tags (web-app-capable, status-bar-style)
- Offline.html fallback page
- Capacitor iOS build (rejected by Apple — 4 guideline violations)

## What We're Building

### 1. Install Experience

**First Visit — Full-Screen Modal:**
- Dark overlay with MyStation branding
- App icon, "Install MyStation" headline
- 3 bullet points: full-screen player, offline access, push notifications
- Platform-specific instructions (iOS: Share → Add to Home Screen, Android: native prompt)
- "Maybe Later" dismiss (30-day cookie: mystation-install-shown)

**Return Visits — Smart Banner:**
- Slim bar at bottom above player/tab bar
- MyStation icon + "Install MyStation App" + Install button
- X dismiss (7-day cookie: mystation-install-banner)
- Only shows if: not installed, not dismissed, not standalone mode

**Detection:**
- window.matchMedia('(display-mode: standalone)') for installed check
- beforeinstallprompt event capture for Android/Desktop native install

### 2. Enhanced Service Worker

- Audio caching: last 10 played tracks (~50MB cap)
- Static asset caching: CSS, JS, fonts, images on first load
- API caching: stale-while-revalidate for GET routes (artist pages, track lists)
- Cache eviction: auto-remove oldest when storage limit hit
- Update toast: "Update available" notification when new SW detected

### 3. Push Notifications

**Backend:**
- POST /api/push/subscribe — stores subscription in Supabase push_subscriptions table
- POST /api/push/send — admin-only broadcast (ADMIN_KEY protected)
- VAPID keys stored in env vars

**Frontend:**
- Permission request AFTER PWA install (not on first visit)
- Notification handler in service worker
- Unsubscribe support

**Supabase Table: push_subscriptions**
- id (uuid, PK)
- user_email (text, nullable)
- endpoint (text, unique)
- p256dh (text)
- auth (text)
- created_at (timestamptz)
- active (boolean, default true)

**Triggers:** New music, LOTL updates, subscription reminders

### 4. Security Hardening

**Headers (next.config.js):**
- Content-Security-Policy: strict, allowing mystationlive.com, Stripe, Supabase, Spotify CDN, R2
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

**Rate Limiting:**
- /api/push/send: 10 req/min
- /api/auth/*: 20 req/min

**CORS:** Only mystationlive.com origin on API routes

### 5. Manifest Enhancement

- Add splash screen images (6 iPhone/iPad sizes)
- Add shortcuts: Now Playing, Search, Merch
- Add share_target for sharing songs TO MyStation
- Add orientation: portrait-primary
- Add handle_links: preferred

### 6. Frontend Polish

- Standalone mode UI: hide install prompts when running as PWA
- iOS safe areas: env(safe-area-inset-*) padding for notch/Dynamic Island
- CSS splash screen while SW boots
- Offline indicator banner when connection drops

### 7. Code Changes

- isNative in lib/native.js → add isPWA() detection
- SubscribeModal shows full Stripe checkout everywhere (no iOS bypass)
- Access code system fully functional (no Apple restrictions)
- Capacitor deps remain (harmless) but code defaults to web

## Files

| File | Action |
|------|--------|
| public/manifest.json | UPDATE — shortcuts, share_target, splash |
| public/sw.js | UPDATE — audio cache, stale-while-revalidate |
| src/components/PWAInstallModal.jsx | NEW |
| src/components/PWAInstallBanner.jsx | NEW |
| src/components/PWAUpdateToast.jsx | NEW |
| src/components/OfflineBanner.jsx | NEW |
| src/hooks/usePWA.js | NEW |
| src/app/api/push/subscribe/route.js | NEW |
| src/app/api/push/send/route.js | NEW |
| src/lib/push.js | NEW |
| src/lib/native.js | UPDATE |
| next.config.js | UPDATE — security headers |
| src/app/layout.jsx | UPDATE — push handler, offline detection |

## Success Criteria

1. User visits mystationlive.com on iPhone → sees install modal → adds to home screen → full-screen app experience
2. Installed PWA plays music, handles subscriptions, shows merch — identical to native
3. Push notifications delivered when new music drops
4. All API routes protected with proper security headers
5. Offline mode shows cached tracks + offline banner
6. Stripe checkout works everywhere — no Apple 30% cut
7. Access codes work everywhere — no restrictions

## Decision: Why PWA Over App Store

- Apple rejected iOS app 4 times (3.1.1, 2.1, 4.0)
- Apple takes 30% of all IAP revenue
- PWA ships instantly — no review wait
- PWA updates instantly — no re-submission
- Works on iPhone, Android, and Desktop
- Full control over payments (Stripe), auth (cookies), and content gating

---

*Approved by Mike Page — March 11, 2026*
