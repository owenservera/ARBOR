// Retirement worker for the old Studio mobile PWA. The canonical installable
// product is apps/mobile-relay, served by the Host, not Studio. This worker
// never intercepts a request, sends a provider message, or touches Studio
// sessions/personal-app data. It only clears former shell-only caches and
// unregisters this historical origin/scope when existing installs update.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      for (const key of await caches.keys()) {
        if (key.startsWith('vivim-mobile-shell-')) await caches.delete(key);
      }
    } finally {
      await self.registration.unregister();
    }
  })());
});
