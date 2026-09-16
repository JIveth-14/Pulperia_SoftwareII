import type { NuevoProducto, Producto } from '../../types';
import type { ProductoRepository } from '../ProductoRepository';
import { CACHE_KEYS, getCacheOrFetch, getCacheTTL, invalidar } from '../../lib/cache';

/** Decorator con caché para `ProductoRepository`. */
export class CachedProductoRepository implements ProductoRepository {
  constructor(private readonly inner: ProductoRepository) {}

  getAll(): Promise<Producto[]> {
    return getCacheOrFetch(CACHE_KEYS.PRODUCTS_LIST, () => this.inner.getAll(), getCacheTTL('PRODUCTS'));
  }

  getById(id: number): Promise<Producto> {
    return getCacheOrFetch(CACHE_KEYS.PRODUCT(id), () => this.inner.getById(id), getCacheTTL('PRODUCTS'));
  }

  async create(nuevo: NuevoProducto): Promise<Producto> {
    const producto = await this.inner.create(nuevo);
    await invalidar({ tipo: 'producto.creado' });
    return producto;
  }

  async update(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
    const producto = await this.inner.update(id, cambios);
    await invalidar({ tipo: 'producto.actualizado', productoId: id });
    return producto;
  }

  async delete(id: number): Promise<void> {
    await this.inner.delete(id);
    await invalidar({ tipo: 'producto.eliminado', productoId: id });
  }
}
