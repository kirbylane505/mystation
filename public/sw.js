/**
 * MyStation Service Worker v11 — Offline Radio Edition
 * Caches R2 audio URLs (cross-origin) for offline playback.
 * Pre-caches IDMG drops on install so the radio always has bumpers ready.
 * Push notification support.
 */

const CACHE_NAME = 'mystation-v11';
const AUDIO_CACHE = 'mystation-audio-v2';
const RADIO_API_CACHE = 'mystation-radio-api-v1';
const OFFLINE_URL = '/offline.html';
const MAX_AUDIO_CACHE_ITEMS = 60;

const R2_ORIGIN = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev';

// Drops — pre-cached on install so offline radio always has bumpers
const DROP_URLS = [
  R2_ORIGIN + '/idmg-drop-01.m4a',
  R2_ORIGIN + '/idmg-drop-02.m4a',
  R2_ORIGIN + '/idmg-drop-03.m4a',
  R2_ORIGIN + '/idmg-drop-04.m4a',
  R2_ORIGIN + '/idmg-drop-05.m4a',
  R2_ORIGIN + '/idmg-drop-06.m4a',
];

// Assets to cache for offline fallback
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install — cache offline assets + drops, skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
      // Pre-cache drops as opaque cross-origin requests
      caches.open(AUDIO_CACHE).then((cache) =>
        Promise.all(
          DROP_URLS.map((url) =>
            fetch(url, { mode: 'no-cors' })
              .then((res) => cache.put(url, res))
              .catch(() => {})
          )
        )
      ),
    ])
  );
  self.skipWaiting();
});

// Activate — delete old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE && name !== RADIO_API_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network-first with audio caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  var url = new URL(event.request.url);

  // Cross-origin requests — pass through untouched.
  // R2 audio URLs (pub-*.r2.dev) MUST NOT be intercepted — iOS Safari PWA
  // can't play opaque (no-cors) responses from service workers. ERR-0056.
  if (!url.href.startsWith(self.location.origin)) return;

  // --- Radio API responses — cache for offline fallback ---
  if (url.pathname.startsWith('/api/mystationradio/')) {
    event.respondWith(handleRadioApiRequest(event.request));
    return;
  }

  // Skip other API calls (except audio streaming proxy)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/audio/stream')) {
    return;
  }

  // Same-origin audio streaming proxy — cache for offline playback
  if (url.pathname.startsWith('/api/audio/stream') ||
      url.pathname.endsWith('.mp3') ||
      url.pathname.endsWith('.m4a')) {
    event.respondWith(handleAudioRequest(event.request));
    return;
  }

  // Navigation requests — network first, offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          return cached || new Response('', { status: 408 });
        });
      })
  );
});

// Cross-origin R2 audio — cache-first (offline playback)
async function handleR2AudioRequest(request) {
  var cache = await caches.open(AUDIO_CACHE);
  var cached = await cache.match(request);
  if (cached) {
    // Background refresh if online — don't await
    fetch(request, { mode: 'no-cors' })
      .then(function(fresh) {
        if (fresh) cache.put(request, fresh.clone()).catch(() => {});
      })
      .catch(() => {});
    return cached;
  }
  try {
    var response = await fetch(request, { mode: 'no-cors' });
    // Store a clone — opaque responses are fine for <audio>
    cache.put(request, response.clone()).then(() => trimAudioCache()).catch(() => {});
    return response;
  } catch (e) {
    return new Response('Offline — track not cached', { status: 503 });
  }
}

// Same-origin audio request handler — network first, cache for offline
async function handleAudioRequest(request) {
  try {
    var response = await fetch(request);
    if (response && response.status === 200) {
      var clone = response.clone();
      var cache = await caches.open(AUDIO_CACHE);
      await cache.put(request, clone);
      await trimAudioCache();
    }
    return response;
  } catch (e) {
    var cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline - track not cached', { status: 503 });
  }
}

// Radio API — stale-while-revalidate so offline gets last-known catalog/queue
async function handleRadioApiRequest(request) {
  var cache = await caches.open(RADIO_API_CACHE);
  var cached = await cache.match(request);
  var networkPromise = fetch(request)
    .then(function(response) {
      if (response && response.status === 200) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(function() { return null; });

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }
  var fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response(JSON.stringify({ error: 'offline', queue: [], artists: [] }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Keep audio cache within limits (FIFO eviction, protect drops)
async function trimAudioCache() {
  var cache = await caches.open(AUDIO_CACHE);
  var keys = await cache.keys();
  if (keys.length <= MAX_AUDIO_CACHE_ITEMS) return;
  // Protect drop URLs from eviction — they're tiny and always needed
  var protectedSet = new Set(DROP_URLS);
  var evictable = keys.filter(function(k) { return !protectedSet.has(k.url); });
  var overflow = keys.length - MAX_AUDIO_CACHE_ITEMS;
  var toDelete = evictable.slice(0, overflow);
  await Promise.all(toDelete.map(function(key) { return cache.delete(key); }));
}

// Push notification handler
self.addEventListener('push', function(event) {
  if (!event.data) return;

  var data;
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'MyStation', body: event.data.text() };
  }

  var options = {
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
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf(self.location.origin) !== -1 && 'focus' in clients[i]) {
          clients[i].navigate(url);
          return clients[i].focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
