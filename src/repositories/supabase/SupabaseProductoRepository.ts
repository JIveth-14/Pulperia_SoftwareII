import type { SupabaseClient } from '@supabase/supabase-js';
import type { NuevoProducto, Producto } from '../../types';
import type { ProductoRepository } from '../ProductoRepository';
import { lanzarSiError } from './errores';

export class SupabaseProductoRepository implements ProductoRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(): Promise<Producto[]> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .order('nombre');
    lanzarSiError(error, { entidad: 'Producto' });
    return data as Producto[];
  }

  async getById(id: number): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
    lanzarSiError(error, { entidad: 'Producto', id });
    return data as Producto;
  }

  async create(nuevo: NuevoProducto): Promise<Producto> {
    const row = { ...nuevo, stock_minimo: nuevo.stock_minimo ?? 5 };
    const { data, error } = await this.supabase
      .from('productos')
      .insert(row)
      .select()
      .single();
    lanzarSiError(error, { entidad: 'Producto' });
    return data as Producto;
  }

  async update(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
    const { data, error } = await this.supabase
      .from('productos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    lanzarSiError(error, { entidad: 'Producto', id });
    return data as Producto;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('productos').delete().eq('id', id);
    lanzarSiError(error, { entidad: 'Producto', id });
  }
}
