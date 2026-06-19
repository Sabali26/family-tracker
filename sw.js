// Family Tracker Pro - Service Worker v1.0
const CACHE_NAME = 'family-tracker-v1.2';
const STATIC_CACHE = 'static-v1.2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS).catch(err => console.log('Cache error:', err)))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Don't cache Google Apps Script calls
  if (url.hostname.includes('script.google.com') || url.hostname.includes('maps.googleapis.com')) {
    return e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })));
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Background sync for location updates
self.addEventListener('sync', e => {
  if (e.tag === 'location-sync') {
    e.waitUntil(syncLocationData());
  }
});

async function syncLocationData() {
  const db = await getOfflineData();
  if (db && db.pendingUpdates) {
    for (const update of db.pendingUpdates) {
      try {
        await fetch(update.url, { method: 'POST', body: JSON.stringify(update.data), headers: { 'Content-Type': 'application/json' } });
      } catch (err) { console.log('Sync failed:', err); }
    }
  }
}

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Family Tracker', body: 'New update' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Family Tracker Pro', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
