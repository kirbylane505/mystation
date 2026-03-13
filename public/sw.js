/**
 * MyStation Service Worker v6 — PWA Edition
 * Network-first with audio caching for offline playback.
 * Push notification support.
 */

const CACHE_NAME = 'mystation-v10';
const AUDIO_CACHE = 'mystation-audio-v1';
const OFFLINE_URL = '/offline.html';
const MAX_AUDIO_CACHE_ITEMS = 10;

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

  var url = new URL(event.request.url);

  // Skip API calls (except audio streaming)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/audio/stream')) {
    return;
  }

  // External requests — pass through (MUST be before audio check so R2 CDN URLs aren't intercepted)
  if (!url.href.startsWith(self.location.origin)) return;

  // Audio streaming — cache for offline playback (same-origin only)
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

// Audio request handler — network first, cache for offline
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

// Keep audio cache within limits (FIFO eviction)
async function trimAudioCache() {
  var cache = await caches.open(AUDIO_CACHE);
  var keys = await cache.keys();
  if (keys.length > MAX_AUDIO_CACHE_ITEMS) {
    var toDelete = keys.slice(0, keys.length - MAX_AUDIO_CACHE_ITEMS);
    await Promise.all(toDelete.map(function(key) { return cache.delete(key); }));
  }
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
