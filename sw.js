/**
 * Service Worker for YUZU.JS Framework
 * Handles fetch events and communicates with the main thread
 */

self.addEventListener("fetch", function(event) {
    // Notify main thread about fetch requests
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                url: event.request.url,
                origin: "yuzu"
            });
        });
    });

    // Pass through the fetch request
    event.respondWith(fetch(event.request));
});