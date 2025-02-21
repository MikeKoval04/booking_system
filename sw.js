self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('v1').then((cache) => {
        return cache.addAll([
          '/',
          'index.html',
          '/styles.css',
          '/scripts.js',
          // Добавьте другие ресурсы, которые должны быть кэшированы
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    if (event.request.url.endsWith('/') || event.request.url.endsWith('/index.html')) {
      // Always fetch from network for the root
      event.respondWith(fetch(event.request));
      return;
    }
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          return caches.open('v1').then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch(() => {
          return caches.match('/offline.html');
        });
      })
    );
  });

