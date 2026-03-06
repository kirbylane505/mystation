/**
 * MyStation Service Worker v5
 * Network-first for ALL requests — guarantees users always get the latest version.
 * Cache is ONLY used as offline fallback. Never serves stale content.
 */

const CACHE_NAME = 'mystation-v6';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline fallback only
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install — cache offline assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches, claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST for everything. Cache is offline fallback only.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip API calls and external requests entirely — let them go direct
  if (event.request.url.includes('/api/') ||
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Navigation requests (page loads) — network first, offline fallback
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

  // Static assets — NETWORK FIRST (not cache-first). Fresh content always wins.
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

// Listen for update messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
