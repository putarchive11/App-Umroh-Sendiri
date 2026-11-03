// Service worker sederhana: cache aset agar aplikasi tetap bisa dibuka saat sinyal lemah.
const CACHE = "umroh-sendiri-v2";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/index.html", "/manifest.json", "/icon.svg"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Audio & file dari domain lain (everyayah, hisnmuslim, font CDN) dibiarkan langsung ke jaringan.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  if (e.request.headers.has("range") || e.request.destination === "audio") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
