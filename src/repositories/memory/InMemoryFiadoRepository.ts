import type { Fiado } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';
import { DEMO_FIADOS } from '../../lib/demo/demo-data';
import { DemoReadOnlyError } from './DemoReadOnlyError';
import { NoEncontradoError } from '../../domain/errors';

/**
 * Implementación en memoria de {@link FiadoRepository} para el modo demo.
 */
export class InMemoryFiadoRepository implements FiadoRepository {
  async getByCliente(clienteId: number): Promise<Fiado[]> {
    return DEMO_FIADOS.filter((f) => f.cliente_id === clienteId);
  }

  async getById(id: number): Promise<Fiado> {
    const fiado = DEMO_FIADOS.find((f) => f.id === id);
    if (!fiado) throw new NoEncontradoError('Fiado', id);
    return fiado;
  }

  async create(): Promise<Fiado> {
    throw new DemoReadOnlyError('fiados.create');
  }
}
