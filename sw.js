// SHADOW FOX — service worker: сайт відкривається як застосунок і працює навіть при поганому інтернеті.
// Спершу мережа (щоб оновлення одразу підтягувались), кеш — лише запасний варіант.
// Запити до посередника/otcharts не кешуються.
const CACHE = "shadow-fox-v1";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./manifest.json"])).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match("./index.html")))
  );
});
