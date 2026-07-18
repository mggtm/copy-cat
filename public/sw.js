/**
 * VendorFlow — Service Worker
 * Enables offline caching and triggers installation banner.
 */

const CACHE_NAME = 'vendorflow-v1';
const ASSETS = [
  '/',
  '/public/css/style.css',
  '/public/js/currency.js',
  '/public/js/charts.js',
  '/public/js/app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request);
    })
  );
});
