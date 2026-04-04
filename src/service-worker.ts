/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Cache names
const CACHE_NAMES = {
  static: 'naijafind-static-v1',
  images: 'naijafind-images-v1',
  api: 'naijafind-api-v1',
  pages: 'naijafind-pages-v1'
};

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/Suji Logo.webp',
  '/supplier-placeholder.svg'
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).catch((err) => {
      console.error('[SW] Precaching failed:', err);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versioned caches
            return Object.values(CACHE_NAMES).some(currentName => 
              name.startsWith(currentName.replace('-v1', '')) && name !== currentName
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy: Cache First for static assets (JS, CSS, fonts)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }
  
  // Strategy: Stale While Revalidate for images
  if (isImage(request)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.images));
    return;
  }
  
  // Strategy: Network First for API calls (Convex)
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
    return;
  }
  
  // Strategy: Network First for pages (for fresh content)
  if (isPageRequest(url)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.pages));
    return;
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});

// Helper: Check if URL is a static asset
function isStaticAsset(url: URL): boolean {
  const staticExtensions = ['.js', '.css', '.woff2', '.woff', '.ttf', '.json'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Helper: Check if request is for an image
function isImage(request: Request): boolean {
  const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg'];
  const acceptHeader = request.headers.get('accept') || '';
  return imageExtensions.some(ext => request.url.endsWith(ext)) || 
         acceptHeader.includes('image');
}

// Helper: Check if request is for API
function isAPIRequest(url: URL): boolean {
  // Convex API endpoints
  return url.pathname.includes('/api/') || 
         url.hostname.includes('convex.cloud') ||
         url.pathname.includes('.convex.site');
}

// Helper: Check if request is for a page
function isPageRequest(url: URL): boolean {
  return !url.pathname.includes('.') || url.pathname.endsWith('.html');
}

// Strategy: Cache First - serve from cache, fallback to network
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first fetch failed:', error);
    // Return offline fallback if available
    return new Response('Offline - Resource not available', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Strategy: Stale While Revalidate - serve from cache, update in background
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cached) {
    // Update cache in background
    networkPromise;
    return cached;
  }
  
  // No cache, wait for network
  const response = await networkPromise;
  if (response) {
    return response;
  }
  
  // Neither cache nor network available
  return new Response('Offline - Image not available', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Strategy: Network First - try network, fallback to cache
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    
    throw error;
  }
}

// Strategy: Network with Cache Fallback
async function networkWithCacheFallback(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(CACHE_NAMES.pages);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    // Return offline page if available
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    throw error;
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls: string[] = event.data.urls;
    event.waitUntil(
      caches.open(CACHE_NAMES.static).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
});

// Push notification support (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'NaijaFind Notification';
  const options = {
    body: data.body,
    icon: '/Suji Logo.webp',
    badge: '/Suji Logo.webp',
    tag: data.tag,
    data: data.url
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data || '/';
  event.waitUntil(
    self.clients.openWindow(url)
  );
});

export {};
