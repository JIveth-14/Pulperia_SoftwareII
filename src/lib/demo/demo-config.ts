/**
 * Configuración centralizada del MODO DEMO.
 *
 * La demo es una versión de solo lectura de la app que corre con datos
 * ficticios en memoria (ver `demo-data.ts`). NO toca Supabase ni la base de
 * datos real, por lo que es imposible modificar producción desde la demo.
 *
 * Ruta pública: /demo  (misma app, mismo build, mismo deploy en Vercel).
 */

/** Credenciales estáticas mostradas al usuario (login real no se usa en demo). */
export const DEMO_CREDENTIALS = {
  email: 'demo@app.com',
  password: 'Demo2026!',
} as const;

/** Usuario demo inyectado (equivalente a `req.user` de la spec original). */
export const DEMO_USER = {
  id: 'demo-001',
  email: DEMO_CREDENTIALS.email,
  isDemoUser: true,
  role: 'admin',
} as const;

/** Duración de la sesión demo en minutos. */
export const DEMO_SESSION_MINUTES = 30;

/** Milisegundos de la sesión demo. */
export const DEMO_SESSION_MS = DEMO_SESSION_MINUTES * 60 * 1000;

/** Nombre de la cookie que guarda el timestamp de expiración (epoch ms). */
export const DEMO_COOKIE = 'demo_session';

/** Prefijo de todas las rutas demo. */
export const DEMO_BASE = '/demo';

/** La demo es siempre de solo lectura: se bloquea crear/editar/eliminar. */
export const DEMO_READ_ONLY = true;

/** Enlaces de navegación dentro de la demo. */
export const DEMO_NAV = [
  { href: '/demo', label: 'Dashboard' },
  { href: '/demo/clientes', label: 'Clientes' },
  { href: '/demo/productos', label: 'Productos' },
  { href: '/demo/ventas', label: 'Ventas' },
] as const;

/** Devuelve true si la ruta pertenece al modo demo. */
export function isDemoPath(pathname: string): boolean {
  return pathname === DEMO_BASE || pathname.startsWith(`${DEMO_BASE}/`);
}

/**
 * Valida las credenciales demo contra las constantes estáticas.
 *
 * Es SEGURO que sean estáticas porque la demo es de solo lectura y con datos
 * en memoria: no valida contra Supabase ni da acceso a datos reales.
 */
export function validateDemoCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  );
}
