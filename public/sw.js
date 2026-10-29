/* SkillTwin Live service worker: deliberately does not cache app or API responses.
 * Navigation always goes to the network, so deployments cannot be hidden behind a stale app shell.
 * The PWA remains installable; offline app usage is intentionally not enabled.
 */
const CACHE_PREFIX = 'skilltwin-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never return a cached HTML document. Ask the network for the current app shell.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(fetch(new Request(request, { cache: 'no-store' })));
  }
  // Other assets and API requests use the browser/network defaults and are never cached by this worker.
});
