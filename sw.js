const CACHE = "ffg-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./schema.js",
  "./regions.js",
  "./app.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    caches.match(ev.request).then(cached => cached || fetch(ev.request).then(resp => {
      if (resp && resp.ok && new URL(ev.request.url).origin === location.origin) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(ev.request, clone));
      }
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
