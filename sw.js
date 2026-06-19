// Family Tracker Pro — Service Worker
// Relative paths — works on ANY GitHub Pages URL
const CACHE = 'ft-v4';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './config.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(err => console.log('Cache warn:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache GAS calls or tile servers
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('arcgisonline.com') ||
      url.hostname.includes('stadiamaps.com') ||
      url.hostname.includes('opentopomap.org')) {
    return e.respondWith(fetch(e.request).catch(() =>
      new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })
    ));
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Family Tracker', body: 'New update' };
  e.waitUntil(self.registration.showNotification(d.title || 'Family Tracker Pro', {
    body: d.body, icon: './icons/icon-192.png',
    badge: './icons/badge-72.png', vibrate: [200, 100, 200]
  }));
});
