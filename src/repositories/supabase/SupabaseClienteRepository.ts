import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../types';
import type { ClienteRepository } from '../ClienteRepository';
import { getCacheOrFetch, deleteCacheKey, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabaseClienteRepository implements ClienteRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(): Promise<Cliente[]> {
    const ttl = getCacheTTL('CLIENTS');
    return getCacheOrFetch(CACHE_KEYS.CLIENTS_LIST, async () => {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .order('nombre');
      if (error) throw new Error(error.message);
      return data as Cliente[];
    }, ttl);
  }

  async getById(id: number): Promise<Cliente> {
    const ttl = getCacheTTL('CLIENTS');
    return getCacheOrFetch(CACHE_KEYS.CLIENT(id), async () => {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as Cliente;
    }, ttl);
  }

  async getConSaldo(): Promise<ClienteConSaldo[]> {
    const ttl = getCacheTTL('CLIENTS');
    return getCacheOrFetch(CACHE_KEYS.CLIENTS_WITH_BALANCE, async () => {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*, fiados(saldo_pendiente)')
        .order('nombre');
      if (error) throw new Error(error.message);

      return (data as any[]).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        direccion: c.direccion,
        created_at: c.created_at,
        saldo: (c.fiados as { saldo_pendiente: number }[]).reduce(
          (sum, f) => sum + Number(f.saldo_pendiente),
          0
        ),
      }));
    }, ttl);
  }

  async buscar(nombre: string): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .order('nombre');
    if (error) throw new Error(error.message);
    return data as Cliente[];
  }

  async create(nuevo: NuevoCliente): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .insert(nuevo)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Invalidate related caches
    await this.invalidateClientCaches();

    return data as Cliente;
  }

  async update(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Invalidate related caches
    await this.invalidateClientCaches(id);

    return data as Cliente;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(error.message);

    // Invalidate related caches
    await this.invalidateClientCaches(id);
  }

  private async invalidateClientCaches(id?: number): Promise<void> {
    const { deleteCacheKey, deleteCacheKeys } = await import('../../lib/cache');

    const keysToInvalidate = [
      CACHE_KEYS.CLIENTS_LIST,
      CACHE_KEYS.CLIENTS_WITH_BALANCE,
      CACHE_KEYS.CLIENT_SEARCH(''), // This is a pattern, but we'll invalidate all
    ];

    if (id) {
      keysToInvalidate.push(CACHE_KEYS.CLIENT(id));
    }

    await deleteCacheKeys(keysToInvalidate);
  }
}