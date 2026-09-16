import { notFound } from 'next/navigation';
import { NoEncontradoError } from '@/domain/errors';

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

/** Espera `promesa` y responde 404 si el registro no existe. */
export async function oNotFound<T>(promesa: Promise<T>): Promise<T> {
  try {
    return await promesa;
  } catch (error) {
    if (error instanceof NoEncontradoError) notFound();
    throw error;
  }
}
