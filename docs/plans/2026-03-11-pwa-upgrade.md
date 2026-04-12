# MyStation PWA Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert MyStation from rejected Capacitor iOS app to a full PWA with install prompts, push notifications, enhanced offline, and security hardening.

**Architecture:** Enhance existing PWA foundations (manifest, SW, meta tags already exist). Add install UX components, upgrade service worker with audio caching, add Web Push API backend, and harden all API routes with security headers. No new dependencies — all vanilla browser APIs.

**Tech Stack:** Next.js 15 (App Router), React, Tailwind CSS, Supabase (push_subscriptions table), Web Push API, Service Worker API, VAPID keys, Zustand

---

### Task 1: usePWA Hook — Install Prompt & Standalone Detection

**Files:**
- Create: `src/hooks/usePWA.js`

**Step 1: Create the hook**

```jsx
'use client';
import { useState, useEffect, useCallback } from 'react';

export default function usePWA() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Standalone detection (installed PWA)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // iOS detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Online/offline
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Capture beforeinstallprompt (Chrome/Android/Desktop)
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setIsStandalone(true);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const canInstall = !isStandalone && (!!deferredPrompt || isIOS);

  return { isStandalone, isOnline, isIOS, canInstall, deferredPrompt, installApp };
}
```

**Step 2: Verify file exists**

Run: `cat src/hooks/usePWA.js | head -5`
Expected: Shows the hook file header

**Step 3: Commit**

```bash
git add src/hooks/usePWA.js
git commit -m "feat: add usePWA hook for install prompt and standalone detection"
```

---

### Task 2: PWA Install Modal — First Visit Full-Screen

**Files:**
- Create: `src/components/PWAInstallModal.jsx`

**Step 1: Create the modal component**

```jsx
'use client';
import { useState, useEffect } from 'react';
import { X, Download, Music, Wifi, Bell } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function PWAInstallModal() {
  const [show, setShow] = useState(false);
  const { isStandalone, isIOS, canInstall, installApp } = usePWA();

  useEffect(() => {
    // Don't show if: already installed, already dismissed, or shown recently
    if (isStandalone) return;
    if (getCookie('mystation-install-shown')) return;
    // Wait 3 seconds before showing (let user see the app first)
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isStandalone]);

  const handleDismiss = () => {
    setShow(false);
    setCookie('mystation-install-shown', '1', 30);
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't auto-install on iOS — just close and let banner remind them
      handleDismiss();
      return;
    }
    const installed = await installApp();
    if (installed) setCookie('mystation-install-shown', '1', 365);
    setShow(false);
  };

  if (!show || !canInstall) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#0f1729] to-[#0a0a1a] border border-white/10 rounded-3xl max-w-sm w-full p-6 relative">
        {/* Close */}
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-white/40 hover:text-white">
          <X size={20} />
        </button>

        {/* App Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Music size={36} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-1">Install MyStation</h2>
        <p className="text-white/50 text-center text-sm mb-6">Add to your home screen</p>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Music size={16} className="text-indigo-400" />
            </div>
            <span className="text-sm">Full-screen music player</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <Wifi size={16} className="text-green-400" />
            </div>
            <span className="text-sm">Works offline with cached tracks</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-amber-400" />
            </div>
            <span className="text-sm">Get notified when new music drops</span>
          </div>
        </div>

        {/* iOS Instructions */}
        {isIOS ? (
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <p className="text-white/70 text-sm text-center mb-2">To install on iPhone:</p>
            <div className="flex items-center justify-center gap-2 text-white text-sm">
              <span>Tap</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>then <strong>"Add to Home Screen"</strong></span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition mb-3"
          >
            <Download size={18} />
            Install Now
          </button>
        )}

        {/* Dismiss */}
        <button onClick={handleDismiss} className="w-full text-center text-white/30 text-sm hover:text-white/50 transition">
          Maybe Later
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/PWAInstallModal.jsx
git commit -m "feat: add PWA install modal for first-time visitors"
```

---

### Task 3: PWA Install Banner — Return Visits

**Files:**
- Create: `src/components/PWAInstallBanner.jsx`

**Step 1: Create the banner component**

```jsx
'use client';
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const { isStandalone, isIOS, canInstall, installApp } = usePWA();

  useEffect(() => {
    if (isStandalone) return;
    if (!canInstall) return;
    // Only show banner if modal was already shown (return visit)
    if (!getCookie('mystation-install-shown')) return;
    // Don't show if banner was dismissed recently
    if (getCookie('mystation-install-banner')) return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [isStandalone, canInstall]);

  const handleDismiss = () => {
    setShow(false);
    setCookie('mystation-install-banner', '1', 7);
  };

  const handleInstall = async () => {
    if (!isIOS) {
      const installed = await installApp();
      if (installed) setCookie('mystation-install-shown', '1', 365);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-[140px] lg:bottom-[100px] left-4 right-4 z-[100] animate-in slide-in-from-bottom-4">
      <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl shadow-black/50 max-w-md mx-auto">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Download size={18} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">Install MyStation</p>
          <p className="text-white/40 text-xs truncate">
            {isIOS ? 'Tap Share → Add to Home Screen' : 'Add to home screen'}
          </p>
        </div>

        {/* Install button (non-iOS only) */}
        {!isIOS && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg flex-shrink-0 hover:bg-indigo-400 transition"
          >
            Install
          </button>
        )}

        {/* Dismiss */}
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 flex-shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/PWAInstallBanner.jsx
git commit -m "feat: add PWA install banner for return visitors"
```

---

### Task 4: Offline Banner

**Files:**
- Create: `src/components/OfflineBanner.jsx`

**Step 1: Create the offline indicator**

```jsx
'use client';
import { WifiOff } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

export default function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff size={14} />
      You're offline — playing cached music
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/OfflineBanner.jsx
git commit -m "feat: add offline indicator banner"
```

---

### Task 5: Update native.js — Add isPWA Detection

**Files:**
- Modify: `src/lib/native.js`

**Step 1: Add isPWA export**

Add after line 7 (after the `isNative` export):

```js
/** Detect if running as installed PWA (standalone mode) */
export const isPWA = typeof window !== 'undefined' && (
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true
);
```

**Step 2: Commit**

```bash
git add src/lib/native.js
git commit -m "feat: add isPWA detection to native.js"
```

---

### Task 6: Enhanced Service Worker — Audio Caching + Push

**Files:**
- Modify: `public/sw.js`

**Step 1: Rewrite sw.js with audio caching and push notification handling**

```js
/**
 * MyStation Service Worker v6 — PWA Edition
 * Network-first with audio caching for offline playback.
 * Push notification support.
 */

const CACHE_NAME = 'mystation-v9';
const AUDIO_CACHE = 'mystation-audio-v1';
const OFFLINE_URL = '/offline.html';
const MAX_AUDIO_CACHE_ITEMS = 10;
const MAX_AUDIO_CACHE_BYTES = 50 * 1024 * 1024; // 50MB

// Assets to cache for offline fallback
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install — cache offline assets, skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first with audio caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API calls (except audio streaming) and external requests
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/audio/stream')) {
    return;
  }

  // Audio streaming — cache for offline playback
  if (url.pathname.startsWith('/api/audio/stream') ||
      url.pathname.endsWith('.mp3') ||
      url.pathname.endsWith('.m4a')) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  // External requests — pass through
  if (!url.href.startsWith(self.location.origin)) return;

  // Navigation requests — network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || new Response('', { status: 408 })))
  );
});

// Audio request handler — network first, cache for offline
async function handleAudioRequest(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      const cache = await caches.open(AUDIO_CACHE);
      await cache.put(request, clone);
      await trimAudioCache();
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline — track not cached', { status: 503 });
  }
}

// Keep audio cache within limits
async function trimAudioCache() {
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_AUDIO_CACHE_ITEMS) {
    // Delete oldest entries (FIFO)
    const toDelete = keys.slice(0, keys.length - MAX_AUDIO_CACHE_ITEMS);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MyStation', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    image: data.image || undefined,
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MyStation', options)
  );
});

// Notification click — open the app/URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

**Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: upgrade service worker v6 — audio caching + push notifications"
```

---

### Task 7: Enhanced Manifest — Shortcuts, Share Target

**Files:**
- Modify: `public/manifest.json`

**Step 1: Replace manifest.json with enhanced version**

```json
{
  "name": "MyStation - Mike Page Foundation",
  "short_name": "MyStation",
  "description": "Stream Mike Page music. Support youth programs.",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#0a0a1a",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "id": "/",
  "scope": "/",
  "icons": [
    { "src": "/icons/icon-48x48.png", "sizes": "48x48", "type": "image/png" },
    { "src": "/icons/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-1024x1024.png", "sizes": "1024x1024", "type": "image/png" }
  ],
  "shortcuts": [
    {
      "name": "Search Music",
      "short_name": "Search",
      "url": "/search?source=pwa",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Shop Merch",
      "short_name": "Merch",
      "url": "/merch?source=pwa",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "LOTL Festival",
      "short_name": "LOTL",
      "url": "/events/lotl-2026?source=pwa",
      "icons": [{ "src": "/icons/icon-96x96.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["music", "entertainment"],
  "screenshots": [
    {
      "src": "/images/og-image.png",
      "sizes": "1200x630",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "related_applications": [],
  "prefer_related_applications": false
}
```

**Step 2: Commit**

```bash
git add public/manifest.json
git commit -m "feat: enhance manifest with full icon suite, shortcuts, PWA source tracking"
```

---

### Task 8: Push Notification Backend — Subscribe Endpoint

**Files:**
- Create: `src/app/api/push/subscribe/route.js`

**Step 1: Create the subscribe API route**

```js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { subscription, email } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
    }

    const keys = subscription.keys || {};

    // Upsert — update if endpoint exists, insert if new
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh || '',
          auth: keys.auth || '',
          user_email: email || null,
          active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Push subscribe error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Unsubscribe
export async function DELETE(request) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('endpoint', endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/push/subscribe/route.js
git commit -m "feat: add push notification subscribe/unsubscribe API"
```

---

### Task 9: Push Notification Backend — Send/Broadcast Endpoint

**Files:**
- Create: `src/app/api/push/send/route.js`
- Create: `src/lib/push.js`

**Step 1: Create VAPID helper lib**

```js
// src/lib/push.js
import webpush from 'web-push';

// Initialize web-push with VAPID keys
// Generate keys: npx web-push generate-vapid-keys
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(
    'mailto:mystationlive@gmail.com',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

export { webpush, VAPID_PUBLIC };
```

**Step 2: Create the send API route**

```js
// src/app/api/push/send/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { webpush } from '@/lib/push';

const ADMIN_KEY = process.env.ADMIN_KEY || 'mtix-admin-2026';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Admin-only
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, url, image } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title or body' }, { status: 400 });
    }

    // Get all active subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('active', true);

    if (error) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const payload = JSON.stringify({ title, body, url: url || '/', image });

    let sent = 0;
    let failed = 0;
    const stale = [];

    // Send to all subscribers
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        try {
          await webpush.sendNotification(pushSub, payload);
          sent++;
        } catch (err) {
          failed++;
          // If subscription expired/invalid, mark inactive
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.endpoint);
          }
        }
      })
    );

    // Clean up stale subscriptions
    if (stale.length > 0) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .in('endpoint', stale);
    }

    return NextResponse.json({ sent, failed, stale: stale.length, total: subs.length });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

**Step 3: Install web-push dependency**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npm install web-push`

**Step 4: Generate VAPID keys**

Run: `npx web-push generate-vapid-keys`

Save the output — add to `.env.local`:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
```

And add to Vercel env vars.

**Step 5: Commit**

```bash
git add src/lib/push.js src/app/api/push/send/route.js package.json package-lock.json
git commit -m "feat: add push notification broadcast API with VAPID + stale cleanup"
```

---

### Task 10: Supabase — Create push_subscriptions Table

**Step 1: Run SQL via supabase-sql.sh**

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL DEFAULT '',
  auth text NOT NULL DEFAULT '',
  user_email text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_push_subs_active ON push_subscriptions (active) WHERE active = true;
CREATE INDEX idx_push_subs_email ON push_subscriptions (user_email) WHERE user_email IS NOT NULL;
```

**Step 2: Verify table exists**

Run: `bash /Users/impossibledreamzmusicgroup/MikePageEmpire/tools/supabase-sql.sh "SELECT count(*) FROM push_subscriptions;"`
Expected: `0`

---

### Task 11: Security Headers — next.config.js

**Files:**
- Modify: `next.config.js`

**Step 1: Add security headers to nextConfig**

Add this `headers()` function inside `nextConfig` (after the `redirects()` function):

```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://js.sentry-cdn.com https://*.posthog.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https: http:",
            "media-src 'self' blob: https://*.r2.cloudflarestorage.com https://*.r2.dev",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://*.posthog.com https://api.spotify.com https://api.deezer.com https://*.r2.cloudflarestorage.com",
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
            "worker-src 'self'",
            "manifest-src 'self'",
          ].join('; '),
        },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ];
},
```

**Step 2: Commit**

```bash
git add next.config.js
git commit -m "feat: add security headers — CSP, HSTS, X-Frame-Options, SW headers"
```

---

### Task 12: Wire Everything Into Layout

**Files:**
- Modify: `src/app/layout.jsx`

**Step 1: Add imports at the top (after existing imports)**

Add after line 28 (`import SecurityShield...`):

```jsx
import PWAInstallModal from '@/components/PWAInstallModal';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import OfflineBanner from '@/components/OfflineBanner';
```

**Step 2: Add components inside ClientProviders**

Add after `<SecurityShield />` (line 213), before the closing `</ClientProviders>`:

```jsx
<PWAInstallModal />
<PWAInstallBanner />
<OfflineBanner />
```

**Step 3: Update SW registration to handle push notification subscription**

Replace the Script tag (lines 215-243) with:

```jsx
<Script id="register-sw" strategy="afterInteractive">
  {`
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
          .then(function(reg) {
            reg.update();
            if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
            reg.addEventListener('updatefound', function() {
              var nw = reg.installing;
              if (nw) nw.addEventListener('statechange', function() {
                if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                  nw.postMessage('SKIP_WAITING');
                }
              });
            });
          })
          .catch(function() {});
      });
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (!refreshing) { refreshing = true; window.location.reload(); }
      });

      // Push notification subscription (after SW is ready)
      if ('PushManager' in window) {
        navigator.serviceWorker.ready.then(function(reg) {
          // Only subscribe if user has granted permission
          if (Notification.permission === 'granted') {
            reg.pushManager.getSubscription().then(function(sub) {
              if (sub) {
                // Send subscription to backend
                fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub })
                }).catch(function() {});
              }
            });
          }
        });
      }
    }
  `}
</Script>
```

**Step 4: Commit**

```bash
git add src/app/layout.jsx
git commit -m "feat: wire PWA install modal, banner, offline indicator, push sub into layout"
```

---

### Task 13: Push Permission Request Component

**Files:**
- Create: `src/components/PushPermission.jsx`

**Step 1: Create push permission request (shows AFTER install)**

```jsx
'use client';
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function PushPermission() {
  const [show, setShow] = useState(false);
  const { isStandalone } = usePWA();

  useEffect(() => {
    // Only show in installed PWA
    if (!isStandalone) return;
    // Only if push is supported
    if (!('PushManager' in window)) return;
    // Only if permission not yet decided
    if (Notification.permission !== 'default') return;
    // Only if not dismissed recently
    if (getCookie('mystation-push-asked')) return;
    // Show after 10 seconds in the app
    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [isStandalone]);

  const handleAllow = async () => {
    setShow(false);
    setCookie('mystation-push-asked', '1', 90);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Subscribe via SW
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      }).catch(() => {});
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setCookie('mystation-push-asked', '1', 30);
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9998] animate-in slide-in-from-top-4 max-w-md mx-auto">
      <div className="bg-[#0f1729] border border-white/10 rounded-2xl p-4 flex items-start gap-3 shadow-xl">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell size={18} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">Get notified when new music drops?</p>
          <p className="text-white/40 text-xs mt-1">We only send notifications for new releases and LOTL updates.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAllow} className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-400 transition">
              Allow
            </button>
            <button onClick={handleDismiss} className="px-4 py-1.5 bg-white/5 text-white/50 text-xs rounded-lg hover:bg-white/10 transition">
              Not Now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/20 hover:text-white/50">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
```

**Step 2: Add to layout.jsx**

Import: `import PushPermission from '@/components/PushPermission';`
Add: `<PushPermission />` after `<OfflineBanner />`

**Step 3: Commit**

```bash
git add src/components/PushPermission.jsx src/app/layout.jsx
git commit -m "feat: add push notification permission request for installed PWA users"
```

---

### Task 14: Local Build Verification

**Step 1: Run local build**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && npx next build`
Expected: Build succeeds with 0 errors

**Step 2: Fix any build errors**

If errors, fix them and re-run build.

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "fix: resolve any build issues from PWA upgrade"
```

---

### Task 15: Deploy + Verify

**Step 1: Check for in-flight builds**

Run: `vercel ls 2>&1 | grep -E "Building|Queued"`
Expected: No active builds

**Step 2: Deploy**

Run: `cd /Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation && vercel --prod`

**Step 3: Verify all pages return 200**

Run:
```bash
for p in / /music /search /merch /events /events/lotl-2026; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://mystationlive.com$p)"
done
```
Expected: All 200

**Step 4: Verify security headers**

Run: `curl -sI https://mystationlive.com | grep -iE 'x-frame|strict-transport|content-security|x-content-type'`
Expected: All 4 security headers present

**Step 5: Verify manifest**

Run: `curl -s https://mystationlive.com/manifest.json | python3 -m json.tool | head -20`
Expected: Shows shortcuts and enhanced manifest

**Step 6: Verify service worker**

Run: `curl -s https://mystationlive.com/sw.js | head -5`
Expected: Shows "MyStation Service Worker v6"
