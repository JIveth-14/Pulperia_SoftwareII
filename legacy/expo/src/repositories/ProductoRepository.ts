import type { NuevoProducto, Producto } from '../types';

/**
 * Abstracción de acceso a datos para el dominio de productos (DIP).
 */
export interface ProductoRepository {
  getAll(): Promise<Producto[]>;
  getById(id: number): Promise<Producto>;
  create(nuevo: NuevoProducto): Promise<Producto>;
  update(id: number, cambios: Partial<NuevoProducto>): Promise<Producto>;
  delete(id: number): Promise<void>;
}