const CACHE = 'aea-frota-v6';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo1.png', './logo2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => c.addAll(['./index.html']))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Não fazer cache de pedidos ao Google Apps Script ou EmailJS
  if (e.request.url.includes('script.google.com') || e.request.url.includes('emailjs.com') || e.request.url.includes('api.emailjs.com')) return fetch(e.request);
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
