/*
 * Service worker de Pulpería.
 *
 * Reglas de seguridad:
 * - NUNCA guarda páginas HTML, respuestas de la API ni datos RSC: contienen
 *   información del negocio y seguirían visibles sin conexión tras cerrar sesión.
 * - Solo cachea archivos estáticos inmutables (/_next/static, íconos) y la
 *   página offline.
 * - Al activarse borra todas las cachés anteriores (incluidas las de la
 *   versión vieja que sí guardaba páginas privadas).
 *
 * Para invalidar la caché en todos los dispositivos, sube VERSION.
 */
const VERSION = 'v2';
const CACHE_ESTATICA = `pulperia-estatico-${VERSION}`;
const PAGINA_OFFLINE = '/offline.html';
const PRECARGA = [PAGINA_OFFLINE, '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_ESTATICA)
      .then((cache) => cache.addAll(PRECARGA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE_ESTATICA).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function esEstatico(url) {
  return url.pathname.startsWith('/_next/static/') || PRECARGA.includes(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Archivos estáticos con hash: primero caché, luego red.
  if (esEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (enCache) =>
          enCache ||
          fetch(request).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone();
              caches.open(CACHE_ESTATICA).then((cache) => cache.put(request, copia));
            }
            return respuesta;
          })
      )
    );
    return;
  }

  // Navegación: siempre red; sin conexión, la página offline (nunca una copia privada).
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(PAGINA_OFFLINE)));
  }

  // Todo lo demás (API, datos RSC, Server Actions) va directo a la red.
});
