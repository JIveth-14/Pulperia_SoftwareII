import type { Fiado, NuevoFiado } from '../../../types';
import type { FiadoRepository } from '../../../repositories';
import { repositories } from '../../../repositories/container';

/**
 * Servicio de fiados. Depende de la interfaz FiadoRepository (DIP).
 */
export class FiadoService {
  constructor(private repo: FiadoRepository = repositories.fiados) {}

  getFiadosByCliente(clienteId: number): Promise<Fiado[]> {
    return this.repo.getByCliente(clienteId);
  }

  getFiadoById(id: number): Promise<Fiado> {
    return this.repo.getById(id);
  }

  createFiado(nuevo: NuevoFiado): Promise<Fiado> {
    return this.repo.create(nuevo);
  }

  /**
   * Crea un fiado a partir de una venta fiada. Centraliza la regla de negocio
   * de "una venta fiada genera un fiado" en el dominio de fiados.
   */
  createFiadoFromVenta(clienteId: number, montoTotal: number): Promise<Fiado> {
    if (montoTotal <= 0) {
      throw new Error('No se puede crear un fiado con monto L 0.00');
    }
    return this.repo.create({ cliente_id: clienteId, monto_total: montoTotal });
  }
}

// Instancia por defecto compartida.
export const fiadoService = new FiadoService();

// Re-export de funciones para compatibilidad con los consumidores actuales.
export const getFiadosByCliente = (clienteId: number) => fiadoService.getFiadosByCliente(clienteId);
export const getFiadoById = (id: number) => fiadoService.getFiadoById(id);
export const createFiado = (nuevo: NuevoFiado) => fiadoService.createFiado(nuevo);
export const createFiadoFromVenta = (clienteId: number, montoTotal: number) =>
  fiadoService.createFiadoFromVenta(clienteId, montoTotal);
