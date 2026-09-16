import type { Producto } from '@/types';
import type { Repositories } from '@/repositories/container';
import {
  validateEnteroNoNegativo,
  validateNombre,
  validatePrecio,
} from '@/lib/security/validators';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';
import { validarOLanzar } from './validacion';

export interface GuardarProductoEntrada {
  /** Sin id se crea; con id se actualiza. */
  id?: number;
  nombre: unknown;
  precio: unknown;
  stock: unknown;
  stock_minimo?: unknown;
}

/** Crea o actualiza un producto del inventario. */
export class GuardarProducto implements CasoDeUso<GuardarProductoEntrada, Producto> {
  constructor(private readonly repos: Pick<Repositories, 'productos'>) {}

  ejecutar(entrada: GuardarProductoEntrada): Promise<Result<Producto>> {
    return ejecutar(async () => {
      const datos = validarOLanzar({
        nombre: () => validateNombre(entrada.nombre),
        precio: () => validatePrecio(entrada.precio),
        stock: () => validateEnteroNoNegativo(entrada.stock, 'Stock'),
        stock_minimo: () =>
          entrada.stock_minimo === undefined || entrada.stock_minimo === ''
            ? 5
            : validateEnteroNoNegativo(entrada.stock_minimo, 'Stock mínimo'),
      });

      return entrada.id
        ? this.repos.productos.update(entrada.id, datos)
        : this.repos.productos.create(datos);
    });
  }
}
