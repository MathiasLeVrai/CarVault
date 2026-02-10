/**
 * CarVault Service Worker
 * Cache les ressources statiques et les réponses API pour le mode offline.
 */

const CACHE_VERSION = 'carvault-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const UPLOADS_CACHE = `${CACHE_VERSION}-uploads`;

// Ressources à pré-cacher (shell de l'app)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ===== Installation =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Activer immédiatement sans attendre les onglets existants
  self.skipWaiting();
});

// ===== Activation =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('carvault-') && key !== STATIC_CACHE && key !== API_CACHE && key !== UPLOADS_CACHE)
          .map((key) => {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  // Prendre le contrôle de tous les clients immédiatement
  self.clients.claim();
});

// ===== Fetch =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;

  // Stratégie pour les appels API : Network First (réseau d'abord, cache en fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Stratégie pour les uploads : Cache First
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirst(request, UPLOADS_CACHE));
    return;
  }

  // Stratégie pour les Google Fonts : Cache First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation (pages HTML) : Network First avec fallback sur index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Tout le reste (assets statiques JS/CSS/images) : Cache First
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ===== Stratégies de cache =====

/**
 * Network First : essaie le réseau, cache en fallback
 * Idéal pour les données dynamiques (API)
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Retourner une réponse JSON vide pour les API en offline
    return new Response(JSON.stringify({ offline: true, error: 'Vous êtes hors ligne' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

/**
 * Cache First : cache prioritaire, réseau en fallback
 * Idéal pour les ressources statiques
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Fallback générique pour les images
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    return new Response('Offline', { status: 503 });
  }
}
