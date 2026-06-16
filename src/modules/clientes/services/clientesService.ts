import { supabase } from '../../../services/supabase/client';
import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../../types';

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Cliente[];
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function createCliente(nuevo: NuevoCliente): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(nuevo)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function updateCliente(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function deleteCliente(id: number): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function buscarClientes(nombre: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('nombre', `%${nombre}%`)
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Cliente[];
}

export async function getClientesConSaldo(): Promise<ClienteConSaldo[]> {
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
