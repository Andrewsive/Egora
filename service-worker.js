// Service Worker for PWA offline support
const CACHE_NAME = 'context-reminder-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/modules/storage.js',
    '/modules/websocket.js',
    '/modules/notifications.js',
    '/modules/timeline.js',
    '/modules/reminders.js',
    '/modules/insights.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
