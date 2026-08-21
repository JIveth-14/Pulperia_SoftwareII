import { supabase } from '../../services/supabase/client';
import type { NuevoProducto, Producto } from '../../types';
import type { ProductoRepository } from '../ProductoRepository';

/**
 * Implementación de ProductoRepository sobre Supabase.
 */
export class SupabaseProductoRepository implements ProductoRepository {
  async getAll(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data as Producto[];
  }

  async getById(id: number): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Producto;
  }

  async create(nuevo: NuevoProducto): Promise<Producto> {
    const row = { ...nuevo, stock_minimo: nuevo.stock_minimo ?? 5 };
    const { data, error } = await supabase
      .from('productos')
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Producto;
  }

  async update(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
    const { data, error } = await supabase
      .from('productos')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Producto;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}