import type { Cliente, ClienteConSaldo } from '../../types';
import type { ClienteRepository } from '../ClienteRepository';
import { DEMO_CLIENTES, DEMO_FIADOS } from '../../lib/demo/demo-data';
import { DemoReadOnlyError } from './DemoReadOnlyError';

/**
 * Implementación en memoria de {@link ClienteRepository} para el modo demo.
 * Cumple el mismo contrato que `SupabaseClienteRepository` (LSP), por lo que
 * las páginas pueden usar cualquiera de las dos indistintamente.
 */
export class InMemoryClienteRepository implements ClienteRepository {
  /** Saldo pendiente de un cliente = suma de saldo_pendiente de sus fiados. */
  private saldoDe(clienteId: number): number {
    return DEMO_FIADOS
      .filter((f) => f.cliente_id === clienteId)
      .reduce((sum, f) => sum + f.saldo_pendiente, 0);
  }

  async getAll(): Promise<Cliente[]> {
    return [...DEMO_CLIENTES];
  }

  async getById(id: number): Promise<Cliente> {
    const cliente = DEMO_CLIENTES.find((c) => c.id === id);
    if (!cliente) throw new Error(`Cliente ${id} no encontrado`);
    return cliente;
  }

  async getConSaldo(): Promise<ClienteConSaldo[]> {
    return DEMO_CLIENTES.map((c) => ({ ...c, saldo: this.saldoDe(c.id) }));
  }

  async buscar(nombre: string): Promise<Cliente[]> {
    const q = nombre.trim().toLowerCase();
    return DEMO_CLIENTES.filter((c) => c.nombre.toLowerCase().includes(q));
  }

  async create(): Promise<Cliente> {
    throw new DemoReadOnlyError('clientes.create');
  }

  async update(): Promise<Cliente> {
    throw new DemoReadOnlyError('clientes.update');
  }

  async delete(): Promise<void> {
    throw new DemoReadOnlyError('clientes.delete');
  }
}
