/* eslint-disable no-restricted-globals */
// Service Worker pour FloDrama
const CACHE_NAME = 'flodrama-cache-v4';
const ROUTES = [
    '/',
    '/anime',
    '/drama',
    '/movie',
    '/profile',
    '/search',
    '/watchlist',
    '/subscription',
    '/account',
    '/categories',
    '/dramas',
    '/movies',
    '/bollywood'
];

// Ressources de base à mettre en cache immédiatement
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Mise en cache des ressources statiques de base');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('Suppression de l\'ancien cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('Service worker activé');
            return self.clients.claim();
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    // Ignorer les requêtes non GET
    if (event.request.method !== 'GET') return;
    
    // Ignorer les requêtes vers des API, services externes ou extensions Chrome
    const url = new URL(event.request.url);
    if (event.request.url.includes('/api/') || 
        event.request.url.includes('amazonaws.com') ||
        url.protocol === 'chrome-extension:') {
        return;
    }

    // Gestion spéciale pour les routes SPA
    const isRoute = ROUTES.some(route => url.pathname === route || 
                                        url.pathname.startsWith(`${route}/`));
    
    if (isRoute) {
        event.respondWith(
            caches.match('/index.html')
                .then(response => {
                    return response || fetch('/index.html');
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération de index.html:', error);
                    return fetch('/index.html');
                })
        );
        return;
    }
    
    // Détection des fichiers statiques (JS, CSS, images)
    const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i);
    
    if (isStaticAsset) {
        // Stratégie cache-first pour les ressources statiques
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Si pas en cache, essayer de récupérer depuis le réseau
                    return fetch(event.request)
                        .then(networkResponse => {
                            // Vérifier que la réponse est valide
                            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                                return networkResponse;
                            }
                            
                            // Mettre en cache la réponse valide
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    try {
                                        cache.put(event.request, responseToCache);
                                    } catch (error) {
                                        console.error('Erreur lors de la mise en cache:', error);
                                    }
                                })
                                .catch(error => {
                                    console.error('Erreur lors de l\'ouverture du cache:', error);
                                });
                            
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Erreur lors de la récupération de la ressource:', error);
                            // Pas de fallback pour les ressources statiques non trouvées
                            return new Response('Ressource non disponible', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
        return;
    }

    // Stratégie network-first pour les autres requêtes
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Vérifier que la réponse est valide
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // Mettre en cache la réponse valide
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        try {
                            cache.put(event.request, responseToCache);
                        } catch (error) {
                            console.error('Erreur lors de la mise en cache:', error);
                        }
                    })
                    .catch(error => {
                        console.error('Erreur lors de l\'ouverture du cache:', error);
                    });
                
                return response;
            })
            .catch(() => {
                // Fallback vers le cache si la requête réseau échoue
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Fallback pour les pages HTML
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        // Pas de fallback pour les autres ressources
                        return new Response('Ressource non disponible', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});
