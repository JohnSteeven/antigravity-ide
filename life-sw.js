const CACHE_NAME = "myjourney-life-shell-v1";
const SHELL = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("myjourney-life-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => { if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone())); return response; }).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok && ["script", "style", "image", "font"].includes(request.destination)) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())); return response; })));
});
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json?.() || {}; } catch { payload = { body: "Open Life to see your reminder." }; }
  event.waitUntil(self.registration.showNotification(payload.title || "MyJourney Life", { body: payload.body || "A gentle reminder is ready.", tag: payload.tag, data: payload.data || { url: "/life/today" }, actions: Array.isArray(payload.actions) ? payload.actions : [] }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); const target = event.notification.data?.url || "/life/today";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => { const existing = clients.find((client) => new URL(client.url).origin === self.location.origin); if (existing) { existing.navigate(target); return existing.focus(); } return self.clients.openWindow(target); }));
});
