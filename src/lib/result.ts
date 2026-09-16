import { DomainError, ValidacionError, type CodigoError } from '@/domain/errors';
import { ValidationError } from '@/lib/security/validators';

/**
 * Resultado de una operación que puede fallar de forma esperada.
 * Los casos de uso y las Server Actions lo devuelven en lugar de lanzar,
 * para que la UI decida qué mostrar sin try/catch.
 */
export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: { codigo: CodigoError; mensaje: string };
      /** Errores por campo del formulario (solo en validaciones). */
      campos?: Record<string, string>;
    };

export function exito<T>(data: T): Result<T> {
  return { ok: true, data };
}

/** Convierte cualquier error en un `Result` fallido con mensaje apto para el usuario. */
export function fallo(error: unknown): Result<never> {
  if (error instanceof ValidacionError) {
    return {
      ok: false,
      error: { codigo: error.codigo, mensaje: error.message },
      campos: error.campos,
    };
  }

  if (error instanceof DomainError) {
    return { ok: false, error: { codigo: error.codigo, mensaje: error.message } };
  }

  // Validadores de lib/security (lanzan su propio tipo).
  if (error instanceof ValidationError) {
    return { ok: false, error: { codigo: 'VALIDACION', mensaje: error.message } };
  }

  console.error('[Result] Error inesperado:', error);
  return {
    ok: false,
    error: { codigo: 'ERROR_DATOS', mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.' },
  };
}

/** Ejecuta `fn` y captura sus errores como `Result`. */
export async function ejecutar<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return exito(await fn());
  } catch (error) {
    return fallo(error);
  }
}
