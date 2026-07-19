/**
 * service-worker.js
 * Cache statique pour usage hors-ligne + support des notifications locales.
 */

const CACHE_NAME = 'solarflux-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/homewizard.js',
  '/js/weather.js',
  '/js/charts.js',
  '/js/particles.js',
  '/js/settings.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne jamais mettre en cache les appels vers les appareils HomeWizard (réseau local)
  // ni vers l'API météo Open-Meteo : on veut toujours des données fraîches.
  if (url.hostname !== self.location.hostname) {
    return; // laisse passer directement au réseau
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Notification déclenchée localement (pas de vrai push server, usage 100% local)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
      if (clientsArr.length > 0) {
        return clientsArr[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
