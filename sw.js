// SHADOW FOX — service worker: застосунок працює як програма, а ще приймає сповіщення з хмари.
// Спершу мережа (щоб оновлення одразу підтягувались), кеш — лише запасний варіант.
const CACHE = "shadow-fox-v2", META = "sf-meta";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./manifest.json"])).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE && x !== META).map(x => caches.delete(x)))).then(() => self.clients.claim()));
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
// Сповіщення: хмара шле «порожній» поштовх, а текст новини ми забираємо самі за таємним sid.
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let n = { title: "🦊 SHADOW FOX", body: "Є новини в Тіньовій лізі" };
    try {
      const c = await caches.open(META), m = await c.match("/push-meta");
      if (m) { const meta = await m.json(); const r = await fetch(meta.base + "/v1/news?sid=" + encodeURIComponent(meta.sid)); if (r.ok) n = await r.json(); }
    } catch (_) {}
    await self.registration.showNotification(n.title || "🦊 SHADOW FOX", { body: n.body || "", tag: "sf-news", renotify: true, data: { url: "./" } });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if ("focus" in c) return c.focus();
    return self.clients.openWindow("./");
  }));
});
