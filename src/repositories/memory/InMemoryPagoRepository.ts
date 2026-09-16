import type { Pago } from '../../types';
import type { PagoRepository } from '../PagoRepository';
import { DEMO_PAGOS, DEMO_FIADOS } from '../../lib/demo/demo-data';
import { DemoReadOnlyError } from './DemoReadOnlyError';

/**
 * Implementación en memoria de {@link PagoRepository} para el modo demo.
 */
export class InMemoryPagoRepository implements PagoRepository {
  async getByFiado(fiadoId: number): Promise<Pago[]> {
    return DEMO_PAGOS.filter((p) => p.fiado_id === fiadoId);
  }

  async getByCliente(clienteId: number): Promise<Pago[]> {
    const fiadosIds = new Set(
      DEMO_FIADOS.filter((f) => f.cliente_id === clienteId).map((f) => f.id)
    );
    return DEMO_PAGOS.filter((p) => fiadosIds.has(p.fiado_id));
  }

  async create(): Promise<Pago> {
    throw new DemoReadOnlyError('pagos.create');
  }
}
