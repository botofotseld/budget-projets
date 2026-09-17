const CACHE = "budget-projets-pwa-20260917114851";

const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./js/app.js",
  "./js/core/state.js",
  "./js/core/router.js",
  "./js/core/events.js",
  "./js/services/currency-service.js",
  "./js/services/attachment-service.js",
  "./js/services/finance-service.js",
  "./js/services/migration-service.js",
  "./js/services/project-service.js",
  "./js/services/relation-service.js",
  "./js/services/storage-service.js",
  "./js/services/transaction-service.js",
  "./js/projects/project-configs.js",
  "./js/modules/ui-modules.js",
  "./js/modules/dashboard.js",
  "./js/modules/projects.js",
  "./js/modules/transactions.js",
  "./js/modules/monthly.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => {
          cache.put(event.request, copy);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
