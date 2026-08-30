import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fiado, NuevoFiado } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';

export class SupabaseFiadoRepository implements FiadoRepository {
  constructor(private supabase: SupabaseClient) {}
  async getByCliente(clienteId: number): Promise<Fiado[]> {
    const { data, error } = await this.supabase
      .from('fiados')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Fiado[];
  }

  async getById(id: number): Promise<Fiado> {
    const { data, error } = await this.supabase
      .from('fiados')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Fiado;
  }

  async create(nuevo: NuevoFiado): Promise<Fiado> {
    const { data, error } = await this.supabase
      .from('fiados')
      .insert({ ...nuevo, saldo_pendiente: nuevo.monto_total, estado: 'pendiente' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Fiado;
  }
}