import type { LineaVentaInput, TipoPago, Venta, VentaConDetalle } from '../types';

/**
 * Abstracción de acceso a datos para el dominio de ventas (DIP).
 */
export interface VentaRepository {
  getAll(): Promise<Venta[]>;
  getDelDia(): Promise<Venta[]>;
  getConDetalle(id: number): Promise<VentaConDetalle>;
  create(
    lineas: LineaVentaInput[],
    clienteId?: number,
    tipoPago?: TipoPago
  ): Promise<Venta>;
}