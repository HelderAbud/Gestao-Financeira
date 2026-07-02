
const CACHE_NAME = "hh-v5-cache-2";

/** Só origem do site — addAll falha se um URL falhar; CDN tratado à parte. */
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./security.js",
  "./db.js",
  "./manifest.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(APP_SHELL);
      } catch {
        /* instalação parcial — fetch em runtime */
      }
      try {
        await cache.add("https://cdn.jsdelivr.net/npm/chart.js");
      } catch {
        /* Chart carrega na rede se falhar cache */
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isNavigation = req.mode === "navigate";
  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first para ficheiros estáticos — NUNCA devolver index.html em vez de .js/.css
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      });
    }).catch(() => fetch(req).catch(() => Response.error()))
  );
});
