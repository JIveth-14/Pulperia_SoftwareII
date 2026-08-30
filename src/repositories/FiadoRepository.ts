import type { Fiado, NuevoFiado } from '../types';

/**
 * Abstracción de acceso a datos para el dominio de fiados (DIP).
 */
export interface FiadoRepository {
  getByCliente(clienteId: number): Promise<Fiado[]>;
  getById(id: number): Promise<Fiado>;
  create(nuevo: NuevoFiado): Promise<Fiado>;
}