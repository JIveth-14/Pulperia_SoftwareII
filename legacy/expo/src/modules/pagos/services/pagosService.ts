import type { NuevoPago, Pago } from '../../../types';
import type { PagoRepository } from '../../../repositories';
import { repositories } from '../../../repositories/container';
import { fiadoService } from '../../fiados/services/fiadosService';

/**
 * Servicio de pagos. Depende de la interfaz PagoRepository (DIP).
 */
export class PagoService {
  constructor(private repo: PagoRepository = repositories.pagos) {}

  createPago(nuevo: NuevoPago): Promise<Pago> {
    return this.repo.create(nuevo);
  }

  getPagosByFiado(fiadoId: number): Promise<Pago[]> {
    return this.repo.getByFiado(fiadoId);
  }

  getPagosByCliente(clienteId: number): Promise<Pago[]> {
    return this.repo.getByCliente(clienteId);
  }

  /**
   * Aplica un monto de pago a los fiados pendientes de un cliente, en orden de
   * antigüedad (por id), hasta agotar el monto. Devuelve el monto efectivamente
   * cobrado. Centraliza la regla de negocio de "cobro de deuda" en el dominio
   * de pagos, en lugar de vivir dentro de una pantalla.
   */
  async pagarDeudaCliente(clienteId: number, monto: number): Promise<number> {
    if (monto <= 0) return 0;

    const fiados = (await fiadoService.getFiadosByCliente(clienteId))
      .filter((f) => Number(f.saldo_pendiente) > 0)
      .sort((a, b) => a.id - b.id);

    let restante = monto;
    for (const f of fiados) {
      if (restante <= 0) break;
      const aPagar = Math.min(restante, Number(f.saldo_pendiente));
      await this.repo.create({ fiado_id: f.id, monto_pagado: aPagar });
      restante -= aPagar;
    }

    return monto - restante;
  }
}

// Instancia por defecto compartida.
export const pagoService = new PagoService();

// Re-export de funciones para compatibilidad con los consumidores actuales.
export const createPago = (nuevo: NuevoPago) => pagoService.createPago(nuevo);
export const getPagosByFiado = (fiadoId: number) => pagoService.getPagosByFiado(fiadoId);
export const getPagosByCliente = (clienteId: number) => pagoService.getPagosByCliente(clienteId);
export const pagarDeudaCliente = (clienteId: number, monto: number) =>
  pagoService.pagarDeudaCliente(clienteId, monto);
