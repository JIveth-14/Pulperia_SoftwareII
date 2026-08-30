import type { LineaVentaInput, TipoPago, Venta, VentaConDetalle } from '../../../types';
import type { VentaRepository } from '../../../repositories';
import { repositories } from '../../../repositories/container';

/**
 * Servicio de ventas. Depende de la interfaz VentaRepository (DIP).
 */
export class VentaService {
  constructor(private repo: VentaRepository = repositories.ventas) {}

  getVentas(): Promise<Venta[]> {
    return this.repo.getAll();
  }

  getVentasDelDia(): Promise<Venta[]> {
    return this.repo.getDelDia();
  }

  getVentaConDetalle(id: number): Promise<VentaConDetalle> {
    return this.repo.getConDetalle(id);
  }

  createVenta(
    lineas: LineaVentaInput[],
    clienteId?: number,
    tipoPago: TipoPago = 'contado'
  ): Promise<Venta> {
    return this.repo.create(lineas, clienteId, tipoPago);
  }
}

// Instancia por defecto compartida.
export const ventaService = new VentaService();

// Re-export de funciones para compatibilidad con los consumidores actuales.
export const getVentas = () => ventaService.getVentas();
export const getVentasDelDia = () => ventaService.getVentasDelDia();
export const getVentaConDetalle = (id: number) => ventaService.getVentaConDetalle(id);
export const createVenta = (
  lineas: LineaVentaInput[],
  clienteId?: number,
  tipoPago: TipoPago = 'contado'
) => ventaService.createVenta(lineas, clienteId, tipoPago);
