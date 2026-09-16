import { expect, type BrowserContext, type Page } from '@playwright/test';
// @ts-expect-error módulo .mjs sin tipos (servidor de pruebas)
import { CREDENCIALES, sesion } from './fake-supabase.mjs';

export { CREDENCIALES };

const SUPABASE = 'http://localhost:54329';

/** Deja los datos de prueba en su estado inicial. */
export async function reiniciarDatos() {
  const r = await fetch(`${SUPABASE}/__reset`, { method: 'POST' });
  expect(r.ok).toBe(true);
}

/** Crea la cookie de sesión que @supabase/ssr espera (sin pasar por el login). */
export async function iniciarSesion(context: BrowserContext) {
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion())).toString('base64url');
  await context.addCookies([
    { name: 'sb-localhost-auth-token', value: valor, domain: 'localhost', path: '/', httpOnly: false, sameSite: 'Lax' },
  ]);
}

export async function iniciarDemo(context: BrowserContext) {
  await context.addCookies([
    { name: 'demo_session', value: String(Date.now() + 25 * 60_000), domain: 'localhost', path: '/demo', httpOnly: true, sameSite: 'Lax' },
  ]);
}

/** Texto sin espacios no separables (Intl los usa en montos y fechas). */
export const plano = (texto: string | null) => (texto ?? '').replace(/[  ]/g, ' ');

/** Enlaces de la barra principal (visibles en escritorio). */
export const navegacion = (page: Page) => page.getByRole('navigation', { name: 'Principal' });
