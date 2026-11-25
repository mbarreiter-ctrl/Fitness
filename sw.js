/* Offline-Cache: Dateien zuerst aus dem Netz, sonst aus dem Cache */
const CACHE = 'formkurve-v1';
const FILES = ['./', 'index.html', 'styles.css', 'manifest.json', 'js/exercises.js', 'js/util.js', 'js/model.js', 'js/charts.js', 'js/body.js', 'js/app.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
