import type { Fiado } from '@/types';
import type { Repositories } from '@/repositories/container';
import { validateMontoPositivo } from '@/lib/security/validators';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';
import { validarOLanzar } from './validacion';

export interface RegistrarFiadoEntrada {
  clienteId: number;
  monto: unknown;
}

/** Registra una deuda manual (fiado) para un cliente existente. */
export class RegistrarFiado implements CasoDeUso<RegistrarFiadoEntrada, Fiado> {
  constructor(private readonly repos: Pick<Repositories, 'clientes' | 'fiados'>) {}

  ejecutar(entrada: RegistrarFiadoEntrada): Promise<Result<Fiado>> {
    return ejecutar(async () => {
      const { monto } = validarOLanzar({ monto: () => validateMontoPositivo(entrada.monto) });
      await this.repos.clientes.getById(entrada.clienteId);
      return this.repos.fiados.create({ cliente_id: entrada.clienteId, monto_total: monto });
    });
  }
}
