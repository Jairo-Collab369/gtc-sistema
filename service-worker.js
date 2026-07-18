const CACHE_NAME = 'gtc-sistema-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './gtc_market_data_v3.html',
  './area5-supervisor.html',
  './gtc_auditor.html',
  './gtc_educacion.html',
  './gtc_fdi_agent.html',
  './gtc_gdi_agent.html',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cualquier dominio externo (TRM, SOFR, café, cobre, Cloudflare Worker, etc.)
  // pasa directo a la red, sin tocar caché. Nunca queremos servir datos
  // financieros viejos desde aquí.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Archivos propios del sistema: siempre intenta traer la versión más
  // fresca de la red primero. El caché solo sirve como respaldo si no hay
  // internet (por ejemplo, en el celular sin señal).
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
