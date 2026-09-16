import type { Producto } from '../../types';
import type { ProductoRepository } from '../ProductoRepository';
import { DEMO_PRODUCTOS } from '../../lib/demo/demo-data';
import { DemoReadOnlyError } from './DemoReadOnlyError';
import { NoEncontradoError } from '../../domain/errors';

/**
 * Implementación en memoria de {@link ProductoRepository} para el modo demo.
 */
export class InMemoryProductoRepository implements ProductoRepository {
  async getAll(): Promise<Producto[]> {
    return [...DEMO_PRODUCTOS];
  }

  async getById(id: number): Promise<Producto> {
    const producto = DEMO_PRODUCTOS.find((p) => p.id === id);
    if (!producto) throw new NoEncontradoError('Producto', id);
    return producto;
  }

  async create(): Promise<Producto> {
    throw new DemoReadOnlyError('productos.create');
  }

  async update(): Promise<Producto> {
    throw new DemoReadOnlyError('productos.update');
  }

  async delete(): Promise<void> {
    throw new DemoReadOnlyError('productos.delete');
  }
}
