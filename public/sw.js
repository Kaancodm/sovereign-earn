/* ============================================================
   Sovereign Earn – Service Worker
   Offline-Cache + Web Push Notifications
   ============================================================ */

const CACHE_NAME = 'sovereign-earn-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).then(() => self.skipWaiting());
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore') ||
      event.request.url.includes('firebaseio') ||
      event.request.url.includes('cloudfunctions') ||
      event.request.url.includes('googleapis.com')) {
    return; // API/Cloud niemals cachen
  }
  // Firebase-Config immer frisch vom Netz holen (network-first),
  // damit Konfig-Änderungen sofort greifen.
  if (event.request.url.includes('/firebase-config.js')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('/index.html');
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Sovereign Earn', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' },
        tag: data.tag || 'default',
        renotify: data.renotify || false,
        requireInteraction: data.important || false
      })
    );
  } catch (e) {
    event.waitUntil(
      self.registration.showNotification('Sovereign Earn', {
        body: event.data.text(),
        icon: '/icons/icon-192.png'
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const c of clientsList) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.postMessage({ type: 'NAVIGATE', url });
          return c.focus();
        }
      }
      if (clients.openWindow) clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    event.source?.postMessage({ type: 'CACHE_CLEARED' });
  }
});