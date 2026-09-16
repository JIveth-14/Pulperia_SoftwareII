import type { Repositories } from '@/repositories/container';
import { ReglaNegocioError } from '@/domain/errors';
import { formatMoney } from '@/lib/format';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';

/**
 * Elimina un cliente. En la BD el borrado es en cascada (fiados y pagos),
 * así que se bloquea si todavía debe dinero: se perdería el registro de la deuda.
 */
export class EliminarCliente implements CasoDeUso<number, void> {
  constructor(private readonly repos: Pick<Repositories, 'clientes' | 'fiados'>) {}

  ejecutar(clienteId: number): Promise<Result<void>> {
    return ejecutar(async () => {
      await this.repos.clientes.getById(clienteId);
      const fiados = await this.repos.fiados.getByCliente(clienteId);
      const saldo = fiados.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);

      if (saldo > 0) {
        throw new ReglaNegocioError(
          `No se puede eliminar: el cliente tiene ${formatMoney(saldo)} pendientes de pago`
        );
      }

      await this.repos.clientes.delete(clienteId);
    });
  }
}
