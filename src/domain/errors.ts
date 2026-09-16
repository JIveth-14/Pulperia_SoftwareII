/**
 * Errores de dominio.
 *
 * Las capas superiores (casos de uso, Server Actions, páginas) solo conocen
 * estos errores, nunca los de Supabase/Postgres. Cada uno trae un `codigo`
 * estable para decidir qué mostrar y un `message` apto para el usuario.
 */

export type CodigoError =
  | 'NO_ENCONTRADO'
  | 'VALIDACION'
  | 'STOCK_INSUFICIENTE'
  | 'PAGO_EXCEDE_SALDO'
  | 'REGLA_NEGOCIO'
  | 'DUPLICADO'
  | 'DEMO_SOLO_LECTURA'
  | 'ERROR_DATOS';

export class DomainError extends Error {
  constructor(
    readonly codigo: CodigoError,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class NoEncontradoError extends DomainError {
  constructor(entidad: string, id?: number | string, options?: { cause?: unknown }) {
    super('NO_ENCONTRADO', id !== undefined ? `${entidad} #${id} no existe` : `${entidad} no existe`, options);
  }
}

export class ValidacionError extends DomainError {
  constructor(
    message: string,
    /** Mensajes por campo, para mostrarlos junto a cada input. */
    readonly campos: Record<string, string> = {},
    options?: { cause?: unknown }
  ) {
    super('VALIDACION', message, options);
  }
}

export class StockInsuficienteError extends DomainError {
  constructor(message = 'Stock insuficiente para completar la venta', options?: { cause?: unknown }) {
    super('STOCK_INSUFICIENTE', message, options);
  }
}

export class PagoExcedeSaldoError extends DomainError {
  constructor(message = 'El pago supera el saldo pendiente', options?: { cause?: unknown }) {
    super('PAGO_EXCEDE_SALDO', message, options);
  }
}

export class ReglaNegocioError extends DomainError {
  constructor(message: string, options?: { cause?: unknown }) {
    super('REGLA_NEGOCIO', message, options);
  }
}

export class DuplicadoError extends DomainError {
  constructor(message = 'Ya existe un registro con esos datos', options?: { cause?: unknown }) {
    super('DUPLICADO', message, options);
  }
}

/** Fallo técnico de la base de datos: el detalle queda en `cause`, no se muestra. */
export class ErrorDeDatos extends DomainError {
  constructor(options?: { cause?: unknown }) {
    super('ERROR_DATOS', 'No se pudo completar la operación. Intenta de nuevo.', options);
  }
}
