import type { ModoDatos } from '@/repositories/container';

export type { ModoDatos };

/** Prefijo de rutas: la demo vive bajo /demo. */
export function rutaBase(modo: ModoDatos): string {
  return modo === 'demo' ? '/demo' : '';
}

export function esDemo(modo: ModoDatos): boolean {
  return modo === 'demo';
}
