import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../types';
import type { ClienteRepository } from '../ClienteRepository';
import { CACHE_KEYS, getCacheOrFetch, getCacheTTL, invalidar } from '../../lib/cache';

/**
 * Decorator: agrega caché a cualquier `ClienteRepository` sin que la
 * implementación envuelta sepa que existe.
 */
export class CachedClienteRepository implements ClienteRepository {
  constructor(private readonly inner: ClienteRepository) {}

  getAll(): Promise<Cliente[]> {
    return getCacheOrFetch(CACHE_KEYS.CLIENTS_LIST, () => this.inner.getAll(), getCacheTTL('CLIENTS'));
  }

  getById(id: number): Promise<Cliente> {
    return getCacheOrFetch(CACHE_KEYS.CLIENT(id), () => this.inner.getById(id), getCacheTTL('CLIENTS'));
  }

  getConSaldo(): Promise<ClienteConSaldo[]> {
    // El saldo cambia con cada fiado/pago: TTL de fiados, no de clientes.
    return getCacheOrFetch(CACHE_KEYS.CLIENTS_WITH_BALANCE, () => this.inner.getConSaldo(), getCacheTTL('FIADOS'));
  }

  /** Búsquedas libres: no se cachean. */
  buscar(nombre: string): Promise<Cliente[]> {
    return this.inner.buscar(nombre);
  }

  async create(nuevo: NuevoCliente): Promise<Cliente> {
    const cliente = await this.inner.create(nuevo);
    await invalidar({ tipo: 'cliente.creado' });
    return cliente;
  }

  async update(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    const cliente = await this.inner.update(id, cambios);
    await invalidar({ tipo: 'cliente.actualizado', clienteId: id });
    return cliente;
  }

  async delete(id: number): Promise<void> {
    await this.inner.delete(id);
    await invalidar({ tipo: 'cliente.eliminado', clienteId: id });
  }
}
