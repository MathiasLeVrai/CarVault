/**
 * Carvio Service Worker
 * Cache les ressources statiques pour le mode offline.
 * Ne cache jamais les réponses API authentifiées ni les médias privés.
 */

const CACHE_VERSION = 'carvio-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Ressources à pré-cacher (shell de l'app)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/favicon-light.png',
  '/icons/favicon-dark.png',
];

// Endpoints API publics (sans données utilisateur) — seuls GET autorisés en cache offline
const PUBLIC_API_CACHE_ALLOWLIST = [
  /^\/api\/brands\/plate\//,
];

// ===== Installation =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// ===== Activation =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => (key.startsWith('carvio-') || key.startsWith('carvault-')) && key !== STATIC_CACHE)
          .map((key) => {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

function isPublicApiPath(pathname) {
  return PUBLIC_API_CACHE_ALLOWLIST.some((re) => re.test(pathname));
}

function hasAuthCredentials(request) {
  if (request.headers.get('Authorization')) return true;
  const cookie = request.headers.get('Cookie') || '';
  return /(?:^|;\s*)carvault_rt=/.test(cookie);
}

// ===== Fetch =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  // API : network-only sauf allowlist publique sans credentials
  if (url.pathname.startsWith('/api/')) {
    if (isPublicApiPath(url.pathname) && !hasAuthCredentials(request)) {
      event.respondWith(networkFirst(request, STATIC_CACHE));
      return;
    }
    event.respondWith(networkOnly(request));
    return;
  }

  // Médias privés (uploads historiques + proxy signé) : jamais de cache
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/api/media')) {
    event.respondWith(networkOnly(request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
    || url.hostname === 'api.fontshare.com' || url.hostname === 'cdn.fontshare.com') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ offline: true, error: 'Vous êtes hors ligne' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      });
    }
    return new Response('Offline', { status: 503 });
  }
}

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
      self.registration.showNotification(data.title || 'Carvio', {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192.png',
        badge: data.badge || '/icons/icon-192.png',
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
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    return new Response('Offline', { status: 503 });
  }
}
