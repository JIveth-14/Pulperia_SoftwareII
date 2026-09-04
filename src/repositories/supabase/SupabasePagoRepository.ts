import type { SupabaseClient } from '@supabase/supabase-js';
import type { NuevoPago, Pago } from '../../types';
import type { PagoRepository } from '../PagoRepository';
import { getCacheOrFetch, deleteCacheKeys, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabasePagoRepository implements PagoRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(nuevo: NuevoPago): Promise<Pago> {
    const { data, error } = await this.supabase
      .from('pagos')
      .insert(nuevo)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.invalidatePagoCaches(nuevo.fiado_id);

    return data as Pago;
  }

  async getByFiado(fiadoId: number): Promise<Pago[]> {
    const ttl = getCacheTTL('PAGOS');
    return getCacheOrFetch(CACHE_KEYS.PAGOS_BY_FIADO(fiadoId), async () => {
      const { data, error } = await this.supabase
        .from('pagos')
        .select('*')
        .eq('fiado_id', fiadoId)
        .order('fecha_pago', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Pago[];
    }, ttl);
  }

  async getByCliente(clienteId: number): Promise<Pago[]> {
    const ttl = getCacheTTL('PAGOS');
    return getCacheOrFetch(`pagos:cliente:${clienteId}`, async () => {
      const { data, error } = await this.supabase
        .from('pagos')
        .select('*, fiados!inner(cliente_id)')
        .eq('fiados.cliente_id', clienteId)
        .order('fecha_pago', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Pago[];
    }, ttl);
  }

  private async invalidatePagoCaches(fiadoId: number): Promise<void> {
    const keysToInvalidate = [
      CACHE_KEYS.PAGOS_LIST,
      CACHE_KEYS.PAGOS_BY_FIADO(fiadoId),
      CACHE_KEYS.FIADOS_LIST,
      CACHE_KEYS.FIADOS_PENDING,
      CACHE_KEYS.FIADOS_PARTIAL,
      CACHE_KEYS.CLIENTS_WITH_BALANCE,
    ];

    await deleteCacheKeys(keysToInvalidate);
  }
}