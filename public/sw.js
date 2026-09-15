// KIMates Service Worker — network-first with offline fallback
// Turbopack-compatible, no external deps

// Bumped v1 -> v2 (2026-09-16): v1 kept images cache-first forever, so returning
// visitors never saw the new K logo. Activating v2 deletes every other cache below.
// Bump again only if a cached copy ever has to be evicted immediately.
const CACHE_NAME = "kimates-v2";
const OFFLINE_URL = "/offline";

// Minimal app shell cached on install
const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  // The real icon files (the .svg names listed here before never existed — 404s).
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/brand/kimates-logo.png",
  "/brand/kimates-logo-white.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Individual adds so one failure doesn't kill the whole shell
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls
  if (url.pathname.startsWith("/api/")) return;

  // HTML navigation: network-first, fall back to cache, then offline page
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Build output: cache-first. Next.js puts a content hash in every /_next/static/
  // filename, so a cached copy can never be stale — a new build means a new URL.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Everything else we serve as a file (logos, icons, public images, fonts):
  // network-first, cached copy only when offline. These keep the same URL when
  // they change — cache-first here is what pinned the old dot logo for returning
  // visitors — so the network must win whenever it is reachable.
  if (
    req.destination === "image" ||
    req.destination === "style" ||
    req.destination === "script" ||
    req.destination === "font"
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error()))
    );
  }
});
