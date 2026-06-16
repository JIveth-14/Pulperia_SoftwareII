import { supabase } from '../../../services/supabase/client';
import type { Pago, NuevoPago } from '../../../types';

export async function createPago(nuevo: NuevoPago): Promise<Pago> {
  const { data, error } = await supabase
    .from('pagos')
    .insert(nuevo)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Pago;
}

export async function getPagosByFiado(fiadoId: number): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('fiado_id', fiadoId)
    .order('fecha_pago', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Pago[];
}

export async function getPagosByCliente(clienteId: number): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, fiados!inner(cliente_id)')
    .eq('fiados.cliente_id', clienteId)
    .order('fecha_pago', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Pago[];
}
