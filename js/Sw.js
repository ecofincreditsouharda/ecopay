/* EcofinPay Service Worker — caches the app shell so the app opens
   instantly and installs as a PWA. API calls always go to network. */

const CACHE_NAME = 'ecofinpay-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/Ecofin New Small trans.png'
];

// Install: pre-cache the shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - Google Apps Script API + all POST requests: always network (live data)
//  - Everything else (shell, fonts, tailwind CDN): cache-first, then network + cache
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached); // offline fallback
    })
  );
});
