/* eslint-disable no-restricted-globals */
// Service Worker pour FloDrama
const CACHE_NAME = 'flodrama-cache-v1';
const ROUTES = [
    '/',
    '/anime',
    '/drama',
    '/movie',
    '/profile',
    '/search',
    '/favorites'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/main.css',
                '/js/main.js',
                '/manifest.json'
            ]);
        })
    );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Retourne la réponse du cache si elle existe
            if (response) {
                return response;
            }

            // Pour les routes SPA, retourne index.html
            if (ROUTES.some(route => event.request.url.includes(route))) {
                return caches.match('/index.html');
            }

            // Sinon, fait la requête réseau
            return fetch(event.request).then((response) => {
                // Ne met en cache que les ressources statiques
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                    return null; // Retourne une valeur pour les caches qu'on ne veut pas supprimer
                })
            );
        })
    );
});
