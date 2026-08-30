import type { NuevoProducto, Producto } from '../../../types';
import type { ProductoRepository } from '../../../repositories';
import { repositories } from '../../../repositories/container';

/**
 * Servicio de productos. Depende de la interfaz ProductoRepository (DIP).
 */
export class ProductoService {
  constructor(private repo: ProductoRepository = repositories.productos) {}

  getProductos(): Promise<Producto[]> {
    return this.repo.getAll();
  }

  getProductoById(id: number): Promise<Producto> {
    return this.repo.getById(id);
  }

  createProducto(nuevo: NuevoProducto): Promise<Producto> {
    return this.repo.create(nuevo);
  }

  updateProducto(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
    return this.repo.update(id, cambios);
  }

  deleteProducto(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}

// Instancia por defecto compartida.
export const productoService = new ProductoService();

// Re-export de funciones para compatibilidad con los consumidores actuales.
export const getProductos = () => productoService.getProductos();
export const getProductoById = (id: number) => productoService.getProductoById(id);
export const createProducto = (nuevo: NuevoProducto) => productoService.createProducto(nuevo);
export const updateProducto = (id: number, cambios: Partial<NuevoProducto>) =>
  productoService.updateProducto(id, cambios);
export const deleteProducto = (id: number) => productoService.deleteProducto(id);
