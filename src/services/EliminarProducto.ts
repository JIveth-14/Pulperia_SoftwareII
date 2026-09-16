import type { Repositories } from '@/repositories/container';
import { ReglaNegocioError } from '@/domain/errors';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';

/**
 * Elimina un producto. Si ya tiene ventas, la BD lo impide
 * (`ON DELETE RESTRICT`) y se explica al usuario.
 */
export class EliminarProducto implements CasoDeUso<number, void> {
  constructor(private readonly repos: Pick<Repositories, 'productos'>) {}

  ejecutar(productoId: number): Promise<Result<void>> {
    return ejecutar(async () => {
      try {
        await this.repos.productos.delete(productoId);
      } catch (error) {
        if (error instanceof ReglaNegocioError && /registros asociados/.test(error.message)) {
          throw new ReglaNegocioError(
            'No se puede eliminar: el producto tiene ventas registradas. Puedes dejar su stock en 0.',
            { cause: error }
          );
        }
        throw error;
      }
    });
  }
}
