import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fiado, NuevoFiado } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';
import { getCacheOrFetch, deleteCacheKeys, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabaseFiadoRepository implements FiadoRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByCliente(clienteId: number): Promise<Fiado[]> {
    const ttl = getCacheTTL('FIADOS');
    return getCacheOrFetch(CACHE_KEYS.FIADOS_BY_CLIENT(clienteId), async () => {
      const { data, error } = await this.supabase
        .from('fiados')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Fiado[];
    }, ttl);
  }

  async getById(id: number): Promise<Fiado> {
    const ttl = getCacheTTL('FIADOS');
    return getCacheOrFetch(CACHE_KEYS.FIADO(id), async () => {
      const { data, error } = await this.supabase
        .from('fiados')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as Fiado;
    }, ttl);
  }

  async create(nuevo: NuevoFiado): Promise<Fiado> {
    const { data, error } = await this.supabase
      .from('fiados')
      .insert({ ...nuevo, saldo_pendiente: nuevo.monto_total, estado: 'pendiente' })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.invalidateFiadoCaches(nuevo.cliente_id);

    return data as Fiado;
  }

  private async invalidateFiadoCaches(clienteId?: number): Promise<void> {
    const keysToInvalidate = [
      CACHE_KEYS.FIADOS_LIST,
      CACHE_KEYS.FIADOS_PENDING,
      CACHE_KEYS.FIADOS_PARTIAL,
      CACHE_KEYS.CLIENTS_WITH_BALANCE,
    ];

    if (clienteId) {
      keysToInvalidate.push(CACHE_KEYS.FIADOS_BY_CLIENT(clienteId));
    }

    await deleteCacheKeys(keysToInvalidate);
  }
}