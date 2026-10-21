const CACHE = "buttons-party-v0.2";   // cambialo a ogni rilascio
const ASSETS = [
    "./", "./index.html", "./manifest.webmanifest", "./assets/icon.svg",
    "./src/style.css", "./src/debug.css",
    "./src/app.js", "./src/debug.js", "./src/controller-ble.js",
    // ...qui gli mp3 di ALL_SOUNDS (generabili con uno script)
];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener("activate", e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", e => {
    if (e.request.method !== "GET") return;
    e.respondWith(
        caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
            if (res.status === 200) {
                const copy = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, copy));
            }
            return res;
        }).catch(() => e.request.mode === "navigate"
            ? caches.match("./index.html")
            : new Response("", {status: 404})))
    );
});