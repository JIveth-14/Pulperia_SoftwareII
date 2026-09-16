import type { PostgrestError } from '@supabase/supabase-js';
import {
  DomainError,
  DuplicadoError,
  ErrorDeDatos,
  NoEncontradoError,
  PagoExcedeSaldoError,
  ReglaNegocioError,
  StockInsuficienteError,
  ValidacionError,
} from '@/domain/errors';

/** Contexto para que el mensaje hable de la entidad correcta. */
export interface ContextoError {
  entidad: string;
  id?: number;
}

type ErrorSupabase = Pick<PostgrestError, 'message'> & Partial<Pick<PostgrestError, 'code' | 'details' | 'hint'>>;

/**
 * Adapter: traduce errores de PostgREST/Postgres a errores de dominio.
 *
 * - PGRST116: `.single()` sin filas → no encontrado
 * - P0001: RAISE EXCEPTION de nuestros triggers/RPC → según el mensaje
 * - 23503: clave foránea → registro relacionado inexistente o en uso
 * - 23505: único duplicado
 * - 23514: CHECK constraint (montos/stock negativos, estados inválidos)
 */
export function aErrorDeDominio(error: ErrorSupabase, contexto: ContextoError): DomainError {
  const opciones = { cause: error };
  const mensaje = error.message ?? '';

  if (error.code === 'PGRST116') {
    return new NoEncontradoError(contexto.entidad, contexto.id, opciones);
  }

  if (/stock insuficiente/i.test(mensaje)) {
    return new StockInsuficienteError(limpiarMensaje(mensaje), opciones);
  }

  if (/supera el saldo pendiente/i.test(mensaje)) {
    return new PagoExcedeSaldoError(limpiarMensaje(mensaje), opciones);
  }

  switch (error.code) {
    case 'P0001':
      return new ReglaNegocioError(limpiarMensaje(mensaje), opciones);
    case '23503':
      return /delete|update/i.test(mensaje) || /still referenced/i.test(error.details ?? '')
        ? new ReglaNegocioError(`No se puede modificar: ${contexto.entidad.toLowerCase()} tiene registros asociados`, opciones)
        : new ReglaNegocioError('Un registro relacionado no existe', opciones);
    case '23505':
      return new DuplicadoError(undefined, opciones);
    case '23514':
      return new ValidacionError('Algún valor no es válido (revisa montos y cantidades)', {}, opciones);
    default:
      return new ErrorDeDatos(opciones);
  }
}

/** Lanza el error de dominio correspondiente si Supabase devolvió error. */
export function lanzarSiError(error: ErrorSupabase | null, contexto: ContextoError): void {
  if (error) throw aErrorDeDominio(error, contexto);
}

function limpiarMensaje(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, '').trim();
}
