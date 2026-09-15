/**
 * Utilidades de sesión demo (lado servidor, RSC).
 *
 * La "sesión" demo es simplemente una cookie con el timestamp (epoch ms) en el
 * que expira. La crea el middleware al entrar a /demo y la lee el layout demo
 * para mostrar el tiempo restante o redirigir a /demo/expirado.
 */

import { cookies } from 'next/headers';
import { DEMO_COOKIE, DEMO_SESSION_MS } from './demo-config';

export interface DemoSession {
  /** Epoch ms en que expira la sesión. */
  expiresAt: number;
  /** true si ya expiró. */
  expired: boolean;
  /** ms restantes (0 si expiró). */
  remainingMs: number;
}

/** Lee la sesión demo desde las cookies. Devuelve null si no existe. */
export async function getDemoSession(): Promise<DemoSession | null> {
  const store = await cookies();
  const raw = store.get(DEMO_COOKIE)?.value;
  if (!raw) return null;

  const expiresAt = Number(raw);
  if (!Number.isFinite(expiresAt)) return null;

  const remainingMs = Math.max(0, expiresAt - Date.now());
  return {
    expiresAt,
    expired: remainingMs <= 0,
    remainingMs,
  };
}

/** Calcula el timestamp de expiración para una nueva sesión demo. */
export function newDemoExpiry(): number {
  return Date.now() + DEMO_SESSION_MS;
}
