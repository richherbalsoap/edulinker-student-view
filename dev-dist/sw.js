// EDULinker Std View — Service Worker
// Network-first: har request fresh server se aayegi
// PWA auto-update hogi bina manual cache clear ke

const CACHE_NAME = "edulinker-sw-v1";

// Turant activate ho jaao, wait mat karo
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Purane caches clean karo aur turant control lo
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
      })
      .then(() => self.clients.claim()),
  );
});

// Network-first strategy — hamesha server se fresh data lo
self.addEventListener("fetch", (event) => {
  // Firebase messaging requests skip karo
  if (
    event.request.url.includes("firebaseinstallations") ||
    event.request.url.includes("fcmregistrations") ||
    event.request.url.includes("firebase")
  ) {
    return;
  }

  // Navigation requests (page loads) — hamesha network se
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Offline fallback — cached index.html serve karo
        return caches.match("/index.html");
      }),
    );
    return;
  }

  // Baaki sab — network first, fail pe cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Successful response cache mein bhi save karo (offline ke liye)
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network fail — cache se serve karo
        return caches.match(event.request);
      }),
  );
});
