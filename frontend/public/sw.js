/**
 * CarVault Service Worker
 * Cache les ressources statiques et les réponses API pour le mode offline.
 */

const CACHE_VERSION = 'carvault-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

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
          .filter((key) => key.startsWith('carvault-') && key !== STATIC_CACHE && key !== API_CACHE)
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

  // Les uploads nécessitent un token d'auth — ne pas intercepter
  if (url.pathname.startsWith('/uploads/')) return;

  // Stratégie pour les Fonts (Google + FontShare) : Cache First
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
    || url.hostname === 'api.fontshare.com' || url.hostname === 'cdn.fontshare.com') {
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

  // Assets statiques JS/CSS : Network First pour toujours avoir la dernière version
  // (Vite ajoute des hash aux fichiers, donc les requêtes réseau sont rapides)
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Tout le reste (images, fonts, etc.) : Cache First
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

// ===== Push Notifications =====
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'CarVault', {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192.svg',
        badge: data.badge || '/icons/icon-192.svg',
        data: { url: data.url || '/alerts' },
        vibrate: [100, 50, 100],
      })
    );
  } catch { /* ignore malformed push */ }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/alerts';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

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
