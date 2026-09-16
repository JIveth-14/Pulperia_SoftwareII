import type { Pago } from '@/types';
import type { Repositories } from '@/repositories/container';
import { PagoExcedeSaldoError, ReglaNegocioError, ValidacionError } from '@/domain/errors';
import { validateMontoPositivo, ValidationError } from '@/lib/security/validators';
import { formatMoney } from '@/lib/format';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';

export interface RegistrarPagoEntrada {
  fiadoId: unknown;
  monto: unknown;
  /** Si se indica, el fiado debe pertenecer a este cliente. */
  clienteId?: number;
}

/**
 * Registra un abono a una deuda (fiado).
 *
 * Valida antes de escribir para dar mensajes claros; el trigger
 * `trg_actualizar_saldo_fiado` vuelve a validar y actualiza saldo y estado.
 */
export class RegistrarPago implements CasoDeUso<RegistrarPagoEntrada, Pago> {
  constructor(private readonly repos: Pick<Repositories, 'pagos' | 'fiados'>) {}

  ejecutar(entrada: RegistrarPagoEntrada): Promise<Result<Pago>> {
    return ejecutar(async () => {
      const fiadoId = Number(entrada.fiadoId);
      if (!Number.isSafeInteger(fiadoId) || fiadoId <= 0) {
        throw new ValidacionError('Selecciona la deuda a abonar', { fiadoId: 'Deuda inválida' });
      }

      let monto: number;
      try {
        monto = validateMontoPositivo(entrada.monto);
      } catch (error) {
        const mensaje = error instanceof ValidationError ? error.message : 'Monto inválido';
        throw new ValidacionError(mensaje, { monto: mensaje });
      }

      const fiado = await this.repos.fiados.getById(fiadoId);

      if (entrada.clienteId !== undefined && fiado.cliente_id !== entrada.clienteId) {
        throw new ReglaNegocioError('La deuda no pertenece a este cliente');
      }

      const saldo = Number(fiado.saldo_pendiente);
      if (fiado.estado === 'pagado' || saldo <= 0) {
        throw new ReglaNegocioError('Esta deuda ya está pagada');
      }
      if (monto > saldo) {
        throw new PagoExcedeSaldoError(
          `El pago (${formatMoney(monto)}) supera el saldo pendiente (${formatMoney(saldo)})`
        );
      }

      return this.repos.pagos.create({ fiado_id: fiadoId, monto_pagado: monto });
    });
  }
}
