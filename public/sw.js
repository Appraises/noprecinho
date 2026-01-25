// Service Worker for offline support and caching
const CACHE_NAME = 'precoja-v1';
const STATIC_CACHE = 'precoja-static-v1';
const DYNAMIC_CACHE = 'precoja-dynamic-v1';
const MAP_TILES_CACHE = 'precoja-tiles-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/css/variables.css',
    '/src/css/base.css',
    '/src/css/components.css',
    '/src/css/panels.css',
    '/src/css/map.css',
    '/src/css/responsive.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== MAP_TILES_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Handle map tiles specially
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(handleMapTiles(request));
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets - cache first
    event.respondWith(handleStaticRequest(request));
});

// Strategy: Cache First for map tiles
async function handleMapTiles(request) {
    const cache = await caches.open(MAP_TILES_CACHE);
    const cached = await cache.match(request);

    if (cached) {
        // Return cached but also update in background
        fetchAndCache(request, MAP_TILES_CACHE);
        return cached;
    }

    return fetchAndCache(request, MAP_TILES_CACHE);
}

// Strategy: Network First for API requests
async function handleApiRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
            // Add header to indicate stale data
            const headers = new Headers(cached.headers);
            headers.append('X-Cached', 'true');
            headers.append('X-Cache-Date', cached.headers.get('date') || 'unknown');

            return new Response(cached.body, {
                status: cached.status,
                statusText: cached.statusText,
                headers
            });
        }

        // Return offline fallback
        return new Response(
            JSON.stringify({ error: 'offline', message: 'Sem conexão com a internet' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Strategy: Stale While Revalidate for static assets
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);

    // Fetch in background regardless
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    // Return cached if available, otherwise wait for network
    if (cached) {
        return cached;
    }

    const response = await fetchPromise;
    if (response) {
        return response;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
        return cache.match('/offline.html') || new Response('Offline', { status: 503 });
    }

    return new Response('Not found', { status: 404 });
}

// Helper to fetch and cache
async function fetchAndCache(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}

// Background sync for offline reports
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reports') {
        event.waitUntil(syncReports());
    }
});

async function syncReports() {
    console.log('[SW] Syncing offline reports');

    // Get pending reports from IndexedDB
    // This would be implemented with actual IndexedDB access
    // For now, just log the attempt

    try {
        // Would iterate through pending reports and POST them
        console.log('[SW] Sync completed');
    } catch (error) {
        console.error('[SW] Sync failed:', error);
        throw error; // Retry later
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};

    const options = {
        body: data.body || 'Nova atualização de preços!',
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'PreçoJá', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((names) =>
                Promise.all(names.map((name) => caches.delete(name)))
            )
        );
    }

    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE).then((cache) =>
                cache.addAll(event.data.urls)
            )
        );
    }
});
