const CACHE = "ffg-v12";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./schema.js",
  "./regions.js",
  "./crypto.js",
  "./standalone.js",
  "./app.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
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
  const reqUrl = new URL(ev.request.url);
  if (reqUrl.origin !== location.origin) return;

  // Network-first for same-origin app files so updates propagate promptly while staying 100% offline-capable.
  ev.respondWith(
    fetch(ev.request).then(resp => {
      if (resp && resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(ev.request, clone));
      }
      return resp;
    }).catch(() => caches.match(ev.request).then(cached => cached || caches.match("./index.html")))
  );
});
