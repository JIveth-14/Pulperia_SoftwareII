import { notFound } from 'next/navigation';

/**
 * Convierte el segmento dinámico `[id]` en un entero positivo.
 * Cualquier otro valor ("abc", "-1", "1.5") responde 404 en vez de
 * consultar la base de datos con NaN.
 */
export function parseIdOrNotFound(raw: string): number {
  if (!/^\d+$/.test(raw)) notFound();
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  return id;
}
