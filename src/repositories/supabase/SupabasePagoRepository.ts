import type { SupabaseClient } from '@supabase/supabase-js';
import type { NuevoPago, Pago } from '../../types';
import type { PagoRepository } from '../PagoRepository';

export class SupabasePagoRepository implements PagoRepository {
  constructor(private supabase: SupabaseClient) {}
  async create(nuevo: NuevoPago): Promise<Pago> {
    const { data, error } = await this.supabase
      .from('pagos')
      .insert(nuevo)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Pago;
  }

  async getByFiado(fiadoId: number): Promise<Pago[]> {
    const { data, error } = await this.supabase
      .from('pagos')
      .select('*')
      .eq('fiado_id', fiadoId)
      .order('fecha_pago', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Pago[];
  }

  async getByCliente(clienteId: number): Promise<Pago[]> {
    const { data, error } = await this.supabase
      .from('pagos')
      .select('*, fiados!inner(cliente_id)')
      .eq('fiados.cliente_id', clienteId)
      .order('fecha_pago', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Pago[];
  }
}