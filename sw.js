// Family Tracker Pro — Service Worker v6
// Works with ANY GitHub Pages URL automatically

// Detect our scope dynamically
const BASE = self.registration.scope; // e.g. https://sabali26.github.io/family-tracker/
const CACHE = 'ft-v6';

const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'config.js',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + '404.html'
];

self.addEventListener('install', e => {
  console.log('[SW] Installing, scope:', BASE);
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .catch(err => console.log('[SW] Cache warn (non-fatal):', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW] Activated');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept external APIs
  if (url.includes('script.google.com') ||
      url.includes('tile.openstreetmap.org') ||
      url.includes('arcgisonline.com') ||
      url.includes('stadiamaps.com') ||
      url.includes('opentopomap.org') ||
      url.includes('unpkg.com') ||
      url.includes('googleapis.com') ||
      url.includes('cdnjs.cloudflare.com')) {
    return; // let browser handle
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful GET responses
        if (res && res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback → serve index.html
        return caches.match(BASE + 'index.html');
      });
    })
  );
});

// Push notifications
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
