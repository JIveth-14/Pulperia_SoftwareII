import type { SupabaseClient } from '@supabase/supabase-js';
import type { Fiado, NuevoFiado } from '../../types';
import type { FiadoRepository } from '../FiadoRepository';
import { lanzarSiError } from './errores';

export class SupabaseFiadoRepository implements FiadoRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByCliente(clienteId: number): Promise<Fiado[]> {
    const { data, error } = await this.supabase
      .from('fiados')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });
    lanzarSiError(error, { entidad: 'Fiado' });
    return data as Fiado[];
  }

  async getById(id: number): Promise<Fiado> {
    const { data, error } = await this.supabase
      .from('fiados')
      .select('*')
      .eq('id', id)
      .single();
    lanzarSiError(error, { entidad: 'Fiado', id });
    return data as Fiado;
  }

  async create(nuevo: NuevoFiado): Promise<Fiado> {
    const { data, error } = await this.supabase
      .from('fiados')
      .insert({ ...nuevo, saldo_pendiente: nuevo.monto_total, estado: 'pendiente' })
      .select()
      .single();
    lanzarSiError(error, { entidad: 'Fiado' });
    return data as Fiado;
  }
}
