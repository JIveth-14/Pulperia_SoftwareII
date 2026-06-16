import { supabase } from '../../../services/supabase/client';
import type { Fiado, NuevoFiado } from '../../../types';

export async function getFiadosByCliente(clienteId: number): Promise<Fiado[]> {
  const { data, error } = await supabase
    .from('fiados')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Fiado[];
}

export async function getFiadoById(id: number): Promise<Fiado> {
  const { data, error } = await supabase
    .from('fiados')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Fiado;
}

export async function createFiado(nuevo: NuevoFiado): Promise<Fiado> {
  const { data, error } = await supabase
    .from('fiados')
    .insert({ ...nuevo, saldo_pendiente: nuevo.monto_total, estado: 'pendiente' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Fiado;
}
