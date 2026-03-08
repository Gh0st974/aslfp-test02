const CACHE_NAME = 'aslfp-v1';

// Fichiers à mettre en cache pour le mode hors-ligne
const ASSETS_TO_CACHE = [
  '/aslfp-test02/',
  '/aslfp-test02/index.html',
  '/aslfp-test02/galerie.html',
  '/aslfp-test02/webtv.html',
  '/aslfp-test02/mentions-legales.html',
  '/aslfp-test02/manifest.json',
  // Ajoutez vos fichiers CSS et JS ici
  // '/aslfp-test02/style.css',
];

// Installation : mise en cache des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mise en cache des ressources...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch : stratégie "Network First, fallback Cache"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mise à jour du cache avec la réponse réseau
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Pas de réseau → on sert depuis le cache
        return caches.match(event.request);
      })
  );
});
