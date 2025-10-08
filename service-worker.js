const CACHE_NAME = 'flag-explorer-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  // Note: Since JS/CSS are bundled dynamically, we can't pre-cache them by name easily.
  // The fetch handler will cache them on the first visit.
];

// URLs to cache on first fetch (API calls, dynamic assets)
const DYNAMIC_CACHE_PATTERNS = [
  'https://restcountries.com/v3.1/all',
  'https://aistudiocdn.com/',
  'https://cdn.jsdelivr.net/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching app shell');
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
            console.log('Deleting old cache:', cacheName);
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

  // Use a cache-first strategy for dynamic assets and API calls
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => url.href.startsWith(pattern))) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Check if we received a valid response
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          // Return cached response if available, otherwise fetch from network
          return response || fetchPromise;
        }).catch(() => {
          // Fallback if both cache and network fail
          // This could be a custom offline page in a real app
          console.error('Fetch failed for:', url.href);
        });
      })
    );
    return;
  }

  // Use a network-first strategy for the app shell to get updates quickly
  // Fallback to cache if network is unavailable
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
           if (networkResponse && networkResponse.status === 200) {
             // Don't cache POST requests or other non-GET requests
             if(event.request.method === 'GET') {
                cache.put(event.request, networkResponse.clone());
             }
           }
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});