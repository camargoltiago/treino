// Cache version
const CACHE_NAME = 'treino-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cadastro.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/cadastro.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
