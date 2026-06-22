// Family Tracker Pro — Service Worker v8
// AUTO-UPDATE: Har deploy pe version badlo — browser automatically update karega

const SW_VERSION = 'ft-v8-' + '20240622'; // ← ye automatically change hoga
const BASE = self.registration.scope;

// ── IMPORTANT: Cache SIRF icons aur basic shell ──────────────
// index.html KABHI cache mat karo — warna updates nahi dikhenge
const PRECACHE = [
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'manifest.json',
];

self.addEventListener('install', e => {
  console.log('[SW] Installing version:', SW_VERSION);
  e.waitUntil(
    caches.open(SW_VERSION)
      .then(c => c.addAll(PRECACHE))
      .catch(err => console.log('[SW] Precache warn:', err))
  );
  // Immediately activate — don't wait for old SW to die
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activated:', SW_VERSION);
  e.waitUntil(
    // Delete ALL old caches
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== SW_VERSION).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open tabs immediately
  );
});

self.addEventListener('fetch', e => {
  const url  = e.request.url;
  const path = new URL(url).pathname;

  // ── NEVER cache these — always fresh from network ──────────
  const neverCache = [
    'script.google.com',     // GAS API
    'tile.openstreetmap.org',// Map tiles
    'arcgisonline.com',      // Satellite tiles
    'stadiamaps.com',        // Dark tiles
    'opentopomap.org',       // Topo tiles
    'unpkg.com',             // Leaflet CDN
    'googleapis.com',        // Google APIs
    'cdnjs.cloudflare.com',  // Font Awesome
    'fonts.gstatic.com',     // Google Fonts
  ];
  if (neverCache.some(h => url.includes(h))) return; // let browser handle

  // ── index.html — NETWORK FIRST, cache fallback ─────────────
  // This ensures latest HTML always loads when online
  if (path.endsWith('/') || path.endsWith('index.html') || path.endsWith('404.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          // Cache fresh copy
          if (res.ok) {
            const clone = res.clone();
            caches.open(SW_VERSION).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // ── config.js — NETWORK FIRST (has GAS URL) ───────────────
  if (path.endsWith('config.js') || path.endsWith('sw.js')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
    );
    return;
  }

  // ── Icons & manifest — CACHE FIRST (rarely change) ─────────
  if (path.includes('/icons/') || path.endsWith('manifest.json')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        return cached || fetch(e.request).then(res => {
          if (res.ok) {
            caches.open(SW_VERSION).then(c => c.put(e.request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Everything else — NETWORK FIRST ───────────────────────
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .catch(() => caches.match(e.request))
  );
});

// ── Push Notifications ────────────────────────────────────────
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || 'Family Tracker Pro', {
      body:    d.body || 'New update',
      icon:    BASE + 'icons/icon-192.png',
      badge:   BASE + 'icons/badge-72.png',
      vibrate: [200, 100, 200],
      tag:     'ft-notif'
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(BASE));
});

// ── Message from page — force update check ───────────────────
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data === 'CHECK_UPDATE') {
    self.registration.update();
  }
});
