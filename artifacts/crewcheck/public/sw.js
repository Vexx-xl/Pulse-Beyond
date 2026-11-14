const CACHE_NAME = "crewcheck-shell-v5-voice-recovery";
const APP_ROOT = new URL("./", self.registration.scope).href;
const APP_INDEX = new URL("index.html", APP_ROOT).href;
const APP_SHELL = [APP_ROOT, APP_INDEX, ...[
  "nasa/iss-a-preview.png",
  "nasa/iss-a.glb",
  "nasa/draco/draco_wasm_wrapper.js",
  "nasa/draco/draco_decoder.wasm",
].map((path) => new URL(path, APP_ROOT).href)];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("crewcheck-shell-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(APP_INDEX, response.clone()));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(APP_INDEX)) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "PRECACHE_VISITED" || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(event.data.urls.filter((url) => typeof url === "string" && url.startsWith("/"))))
      .then(() => event.ports[0]?.postMessage({ status: "ready" }))
      .catch(() => event.ports[0]?.postMessage({ status: "incomplete" })),
  );
});
