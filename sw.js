// Offline-Unterstützung: App-Dateien und geladene Bilder werden zwischengespeichert.
const CACHE = "skova-v3";
const CORE = ["./", "index.html", "css/style.css", "js/data.js", "js/app.js", "js/more/politik.js", "js/more/wissen.js", "js/more/laender.js", "js/more/kriege.js", "js/more/geschichte.js", "js/more/wissenschaft.js", "js/more/weltraum.js", "js/more/natur.js", "js/more/geld.js", "js/more/technik.js", "js/levels/politik.js", "js/levels/wissen.js", "js/levels/laender.js", "js/levels/kriege.js", "js/levels/geschichte.js", "js/levels/wissenschaft.js", "js/levels/weltraum.js", "js/levels/natur.js", "js/levels/geld.js", "js/levels/technik.js", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Eigene Dateien: erst Netz (für Updates), sonst Cache
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match("index.html"))));
    return;
  }
  // Wikipedia-Bilder & Schriften: Cache zuerst
  if (/wikimedia\.org|wikipedia\.org|fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return r; })));
  }
});
