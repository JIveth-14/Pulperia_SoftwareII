import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../types';
import type { ClienteRepository } from '../ClienteRepository';
import { lanzarSiError } from './errores';

/**
 * Acceso a `clientes` en Supabase. Sin caché: la aplica
 * `CachedClienteRepository` (Decorator) desde el contenedor.
 */
export class SupabaseClienteRepository implements ClienteRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .order('nombre');
    lanzarSiError(error, { entidad: 'Cliente' });
    return data as Cliente[];
  }

  async getById(id: number): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    lanzarSiError(error, { entidad: 'Cliente', id });
    return data as Cliente;
  }

  async getConSaldo(): Promise<ClienteConSaldo[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*, fiados(saldo_pendiente)')
      .order('nombre');
    lanzarSiError(error, { entidad: 'Cliente' });

    type Fila = Cliente & { fiados: { saldo_pendiente: number | string }[] | null };
    return (data as Fila[]).map(({ fiados, ...cliente }) => ({
      ...cliente,
      saldo: (fiados ?? []).reduce((sum, f) => sum + Number(f.saldo_pendiente), 0),
    }));
  }

  async buscar(nombre: string): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .order('nombre');
    lanzarSiError(error, { entidad: 'Cliente' });
    return data as Cliente[];
  }

  async create(nuevo: NuevoCliente): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .insert(nuevo)
      .select()
      .single();
    lanzarSiError(error, { entidad: 'Cliente' });
    return data as Cliente;
  }

  async update(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    lanzarSiError(error, { entidad: 'Cliente', id });
    return data as Cliente;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.from('clientes').delete().eq('id', id);
    lanzarSiError(error, { entidad: 'Cliente', id });
  }
}
