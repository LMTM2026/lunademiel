// Guarda una copia de la app para que abra sin internet (safari, aviones, islas).
// Los datos del viaje los guarda Firebase en el teléfono y se sincronizan al volver la señal.
const CACHE = 'luna-de-miel-v5';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-app-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@10.14.1/firebase-firestore-compat.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase (login y datos) siempre va directo a la red; Firebase maneja su propio modo sin conexión.
  if (/googleapis\.com|firebaseio|identitytoolkit|securetoken/.test(url.hostname)) return;
  // La página: primero la red (versión más nueva), si no hay señal, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Scripts, íconos y fuentes: la copia guardada, y se actualiza en segundo plano.
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
