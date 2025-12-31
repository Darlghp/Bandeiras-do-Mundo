
const CACHE_NAME = 'flag-explorer-cache-v2';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
];

const DYNAMIC_CACHE_PATTERNS = [
  'https://restcountries.com/v3.1/all',
  'https://aistudiocdn.com/',
  'https://cdn.jsdelivr.net/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Estratégia Stale-While-Revalidate para recursos externos
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => url.href.startsWith(pattern))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            // Se falhar e não houver cache, retorna um erro amigável ou deixa falhar para o app tratar
            if (!cachedResponse) throw err;
            return cachedResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Estratégia Network-First com fallback para cache para o resto do app
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
           const responseClone = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
