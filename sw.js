const CACHE_NAME = 'booking-system-v2';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './room1.html',
  './room2.html',
  './room3.html',
  './index_legacy.html',
  './room1_legacy.html',
  './room2_legacy.html',
  './room3_legacy.html',
  './manifest.json',
  './assets/styles.css',
  './assets/styles_legacy.css',
  './assets/favicon-32x32.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './back.png',
  './share.png',
  './add.png',
  './iosicon.png',
  './tgicon.png'
];

// Cloudflare Pages serves HTML with extensionless URLs, while GitHub Pages
// keeps the .html suffix. These routes are cached on hosts that provide them.
const OPTIONAL_ROUTES = [
  './offline',
  './room1',
  './room2',
  './room3',
  './index_legacy',
  './room1_legacy',
  './room2_legacy',
  './room3_legacy'
];

async function cacheOptionalRoutes(cache) {
  await Promise.allSettled(
    OPTIONAL_ROUTES.map(async (url) => {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        await cache.addAll(APP_SHELL);
        await cacheOptionalRoutes(cache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match('./offline.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    })
  );
});
