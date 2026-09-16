import type { LineaVentaInput, TipoPago, Venta, VentaConDetalle } from '../../types';
import type { VentaRepository } from '../VentaRepository';
import { CACHE_KEYS, getCacheOrFetch, getCacheTTL, invalidar } from '../../lib/cache';

/** Decorator con caché para `VentaRepository`. */
export class CachedVentaRepository implements VentaRepository {
  constructor(private readonly inner: VentaRepository) {}

  getAll(): Promise<Venta[]> {
    return getCacheOrFetch(CACHE_KEYS.VENTAS_LIST, () => this.inner.getAll(), getCacheTTL('SALES'));
  }

  getDelDia(): Promise<Venta[]> {
    // TTL corto: el total del día cambia con cada venta y al cambiar de día.
    return getCacheOrFetch(CACHE_KEYS.VENTAS_TODAY, () => this.inner.getDelDia(), getCacheTTL('SALES', 120));
  }

  getConDetalle(id: number): Promise<VentaConDetalle> {
    return getCacheOrFetch(CACHE_KEYS.VENTA(id), () => this.inner.getConDetalle(id), getCacheTTL('SALES'));
  }

  async create(lineas: LineaVentaInput[], clienteId?: number, tipoPago?: TipoPago): Promise<Venta> {
    const venta = await this.inner.create(lineas, clienteId, tipoPago);
    await invalidar({
      tipo: 'venta.registrada',
      productoIds: [...new Set(lineas.map((l) => l.producto_id))],
      clienteId,
      fiado: tipoPago === 'fiado',
    });
    return venta;
  }
}
