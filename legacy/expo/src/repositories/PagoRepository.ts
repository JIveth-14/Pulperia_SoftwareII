import type { NuevoPago, Pago } from '../types';

/**
 * Abstracción de acceso a datos para el dominio de pagos (DIP).
 */
export interface PagoRepository {
  create(nuevo: NuevoPago): Promise<Pago>;
  getByFiado(fiadoId: number): Promise<Pago[]>;
  getByCliente(clienteId: number): Promise<Pago[]>;
}