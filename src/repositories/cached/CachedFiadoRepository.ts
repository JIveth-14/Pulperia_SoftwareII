import type { Fiado, NuevoFiado } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';
import { CACHE_KEYS, getCacheOrFetch, getCacheTTL, invalidar } from '../../lib/cache';

/** Decorator con caché para `FiadoRepository`. */
export class CachedFiadoRepository implements FiadoRepository {
  constructor(private readonly inner: FiadoRepository) {}

  getByCliente(clienteId: number): Promise<Fiado[]> {
    return getCacheOrFetch(
      CACHE_KEYS.FIADOS_BY_CLIENT(clienteId),
      () => this.inner.getByCliente(clienteId),
      getCacheTTL('FIADOS')
    );
  }

  getById(id: number): Promise<Fiado> {
    return getCacheOrFetch(CACHE_KEYS.FIADO(id), () => this.inner.getById(id), getCacheTTL('FIADOS'));
  }

  async create(nuevo: NuevoFiado): Promise<Fiado> {
    const fiado = await this.inner.create(nuevo);
    await invalidar({ tipo: 'fiado.creado', clienteId: nuevo.cliente_id });
    return fiado;
  }
}
