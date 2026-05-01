const CACHE = 'aea-frota-v8';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './logo1.png', './logo2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage({type:'RELOAD'}))))
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Sempre buscar a rede para index.html e APIs externas
  if (url.includes('script.google.com') || url.includes('emailjs.com') ||
      url.includes('api.emailjs.com') || url.endsWith('/frota/') ||
      url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Cache-first para assets estáticos
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
