import type { SupabaseClient } from '@supabase/supabase-js';
import type { NuevoPago, Pago } from '../../types';
import type { PagoRepository } from '../PagoRepository';
import { getCacheOrFetch, deleteCacheKeys, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabasePagoRepository implements PagoRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(nuevo: NuevoPago): Promise<Pago> {
    // Se trae el cliente del fiado para invalidar su saldo y su historial.
    const { data, error } = await this.supabase
      .from('pagos')
      .insert(nuevo)
      .select('*, fiados(cliente_id)')
      .single();
    if (error) throw new Error(error.message);

    const { fiados, ...pago } = data as Pago & { fiados: { cliente_id: number } | null };
    await this.invalidatePagoCaches(nuevo.fiado_id, fiados?.cliente_id);

    return pago as Pago;
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
    return getCacheOrFetch(CACHE_KEYS.PAGOS_BY_CLIENT(clienteId), async () => {
      const { data, error } = await this.supabase
        .from('pagos')
        .select('*, fiados!inner(cliente_id)')
        .eq('fiados.cliente_id', clienteId)
        .order('fecha_pago', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Pago[];
    }, ttl);
  }

  private async invalidatePagoCaches(fiadoId: number, clienteId?: number): Promise<void> {
    // El trigger trg_actualizar_saldo_fiado cambia saldo y estado del fiado.
    const keysToInvalidate = [
      CACHE_KEYS.PAGOS_LIST,
      CACHE_KEYS.PAGOS_BY_FIADO(fiadoId),
      CACHE_KEYS.FIADO(fiadoId),
      CACHE_KEYS.FIADOS_LIST,
      CACHE_KEYS.FIADOS_PENDING,
      CACHE_KEYS.FIADOS_PARTIAL,
      CACHE_KEYS.CLIENTS_WITH_BALANCE,
      CACHE_KEYS.DASHBOARD_SUMMARY,
    ];

    if (clienteId) {
      keysToInvalidate.push(
        CACHE_KEYS.FIADOS_BY_CLIENT(clienteId),
        CACHE_KEYS.PAGOS_BY_CLIENT(clienteId)
      );
    }

    await deleteCacheKeys(keysToInvalidate);
  }
}