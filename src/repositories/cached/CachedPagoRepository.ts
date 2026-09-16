import type { NuevoPago, Pago } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';
import type { PagoRepository } from '../PagoRepository';
import { CACHE_KEYS, getCacheOrFetch, getCacheTTL, invalidar } from '../../lib/cache';

/**
 * Decorator con caché para `PagoRepository`. Necesita los fiados (sin caché)
 * para saber de qué cliente es el pago y limpiar su saldo.
 */
export class CachedPagoRepository implements PagoRepository {
  constructor(
    private readonly inner: PagoRepository,
    private readonly fiados: FiadoRepository
  ) {}

  getByFiado(fiadoId: number): Promise<Pago[]> {
    return getCacheOrFetch(
      CACHE_KEYS.PAGOS_BY_FIADO(fiadoId),
      () => this.inner.getByFiado(fiadoId),
      getCacheTTL('PAGOS')
    );
  }

  getByCliente(clienteId: number): Promise<Pago[]> {
    return getCacheOrFetch(
      CACHE_KEYS.PAGOS_BY_CLIENT(clienteId),
      () => this.inner.getByCliente(clienteId),
      getCacheTTL('PAGOS')
    );
  }

  async create(nuevo: NuevoPago): Promise<Pago> {
    const pago = await this.inner.create(nuevo);
    const fiado = await this.fiados.getById(nuevo.fiado_id);
    await invalidar({ tipo: 'pago.registrado', fiadoId: nuevo.fiado_id, clienteId: fiado.cliente_id });
    return pago;
  }
}
