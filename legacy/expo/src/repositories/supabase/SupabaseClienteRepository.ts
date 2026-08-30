import { supabase } from '../../services/supabase/client';
import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../types';
import type { ClienteRepository } from '../ClienteRepository';

/**
 * Implementación de ClienteRepository sobre Supabase.
 */
export class SupabaseClienteRepository implements ClienteRepository {
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data as Cliente[];
  }

  async getById(id: number): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  }

  async getConSaldo(): Promise<ClienteConSaldo[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, fiados(saldo_pendiente)')
      .order('nombre');
    if (error) throw new Error(error.message);

    return (data as any[]).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      direccion: c.direccion,
      created_at: c.created_at,
      saldo: (c.fiados as { saldo_pendiente: number }[]).reduce(
        (sum, f) => sum + Number(f.saldo_pendiente),
        0
      ),
    }));
  }

  async buscar(nombre: string): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .ilike('nombre', `%${nombre}%`)
      .order('nombre');
    if (error) throw new Error(error.message);
    return data as Cliente[];
  }

  async create(nuevo: NuevoCliente): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert(nuevo)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  }

  async update(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Cliente;
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}