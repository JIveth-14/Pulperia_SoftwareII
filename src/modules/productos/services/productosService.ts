import { supabase } from '../../../services/supabase/client';
import type { Producto, NuevoProducto } from '../../../types';

export async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Producto[];
}

export async function getProductoById(id: number): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function createProducto(nuevo: NuevoProducto): Promise<Producto> {
  const row = { ...nuevo, stock_minimo: nuevo.stock_minimo ?? 5 };
  const { data, error } = await supabase
    .from('productos')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function updateProducto(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function deleteProducto(id: number): Promise<void> {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
