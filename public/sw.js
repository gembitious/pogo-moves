// Minimal hand-rolled service worker (no Workbox — @vite-pwa/astro doesn't yet
// support Astro 6). Gives offline + installability:
//   - navigations: network-first (new deploys show immediately; cache is the offline fallback)
//   - hashed build assets (/_astro): cache-first (immutable filenames)
//   - data + images: cache them so the app works offline after a first visit
const CACHE = 'pogo-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return // let cross-origin (font CDNs) pass through

  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request))
  } else if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/')) {
    e.respondWith(cacheFirst(request))
  } else {
    e.respondWith(staleWhileRevalidate(request))
  }
})

async function cacheFirst(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return (await cache.match(req)) || (await cache.match('/ko')) || Response.error()
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(req)
  const fetching = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => hit)
  return hit || fetching
}
