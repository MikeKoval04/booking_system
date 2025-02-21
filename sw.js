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
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Remove or comment out these lines:
          // if (fetchResponse.redirected) {
          //   return fetchResponse;
          // }
          return caches.open('v1').then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }).catch((error) => {
          console.error('Ошибка при запросе:', error);
          return caches.match('/offline.html'); // Подставьте свой offline-ресурс
        });
      })
    );
  });

