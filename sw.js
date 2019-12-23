// sw.js

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    'index.html',
    'styles.css',
    'css/article.css',
    'css/base.css',
    'locale/en.json'
];
const RUNTIME = 'runtime';
const INSTALL = 'install-3.1.0.9';

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(INSTALL)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(self.skipWaiting())
    );
    console.log('Install!');
});

self.addEventListener("activate", function (event) {
    console.log('Activate!');
    const currentCaches = [INSTALL, RUNTIME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', function (event) {
    console.log('Fetch!', event.request);
    // Skip cross-origin requests, like those for Google Analytics.
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    console.log('cached response for:' + event.request)
                    return cachedResponse;
                }

                return caches.open(RUNTIME).then(cache => {
                    return fetch(event.request).then(response => {
                        // Put a copy of the response in the runtime cache.
                        return cache.put(event.request, response.clone()).then(() => {
                            return response;
                        });
                    });
                });
            })
        );
    }
});

// navigator.serviceWorker.ready.then(function (registration) {
//     if (!registration.pushManager) {
//         alert('No push notifications support.');
//         return false;
//     }
//     //To subscribe `push notification` from push manager
//     registration.pushManager.subscribe({
//         userVisibleOnly: true //Always show notification when received
//     })
//         .then(function (subscription) {
//             console.log('Subscribed.');
//         })
//         .catch(function (error) {
//             console.log('Subscription error: ', error);
//         });
// })