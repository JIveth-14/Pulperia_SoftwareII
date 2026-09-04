import type { SupabaseClient } from '@supabase/supabase-js';
import type { NuevoProducto, Producto } from '../../types';
import type { ProductoRepository } from '../ProductoRepository';
import { getCacheOrFetch, deleteCacheKeys, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabaseProductoRepository implements ProductoRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(): Promise<Producto[]> {
    const ttl = getCacheTTL('PRODUCTS');
    return getCacheOrFetch(CACHE_KEYS.PRODUCTS_LIST, async () => {
      const { data, error } = await this.supabase
        .from('productos')
        .select('*')
        .order('nombre');
      if (error) throw new Error(error.message);
      return data as Producto[];
    }, ttl);
  }

  async getById(id: number): Promise<Producto> {
    const ttl = getCacheTTL('PRODUCTS');
    return getCacheOrFetch(CACHE_KEYS.PRODUCT(id), async () => {
      const { data, error } = await this.supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data as Producto;
    }, ttl);
  }

  async create(nuevo: NuevoProducto): Promise<Producto> {
    const row = { ...nuevo, stock_minimo: nuevo.stock_minimo ?? 5 };
    const { data, error } = await this.supabase
      .from('productos')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.invalidateProductCaches();

    return data as Producto;
  }

  async update(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('productos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.invalidateProductCaches(id);

    return data as Producto;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('productos').delete().eq('id', id);
    if (error) throw new Error(error.message);

    await this.invalidateProductCaches(id);
  }

  private async invalidateProductCaches(id?: number): Promise<void> {
    const keysToInvalidate = [
      CACHE_KEYS.PRODUCTS_LIST,
      CACHE_KEYS.PRODUCTS_LOW_STOCK,
      CACHE_KEYS.PRODUCTS_BY_STOCK,
    ];

    if (id) {
      keysToInvalidate.push(CACHE_KEYS.PRODUCT(id));
    }

    await deleteCacheKeys(keysToInvalidate);
  }
}