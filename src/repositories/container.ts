import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ClienteRepository,
  FiadoRepository,
  PagoRepository,
  ProductoRepository,
  VentaRepository,
} from './index';
import {
  SupabaseClienteRepository,
  SupabaseFiadoRepository,
  SupabasePagoRepository,
  SupabaseProductoRepository,
  SupabaseVentaRepository,
} from './supabase';

export type Repositories = ReturnType<typeof createRepositories>;

export function createRepositories(supabase: SupabaseClient) {
  return {
    clientes: new SupabaseClienteRepository(supabase) as ClienteRepository,
    productos: new SupabaseProductoRepository(supabase) as ProductoRepository,
    fiados: new SupabaseFiadoRepository(supabase) as FiadoRepository,
    pagos: new SupabasePagoRepository(supabase) as PagoRepository,
    ventas: new SupabaseVentaRepository(supabase) as VentaRepository,
  };
}

// Dummy para compatibilidad con código RN heredado (será reemplazado en Fase 6).
// No se puede crear sin un cliente real; se dejó aquí solo para que compile.
class DummyRepository {
  async getAll() { throw new Error('Dummy repo'); }
  async getById() { throw new Error('Dummy repo'); }
  async getConSaldo() { throw new Error('Dummy repo'); }
  async buscar() { throw new Error('Dummy repo'); }
  async create() { throw new Error('Dummy repo'); }
  async update() { throw new Error('Dummy repo'); }
  async delete() { throw new Error('Dummy repo'); }
  async getByCliente() { throw new Error('Dummy repo'); }
  async getByFiado() { throw new Error('Dummy repo'); }
  async getDelDia() { throw new Error('Dummy repo'); }
  async getConDetalle() { throw new Error('Dummy repo'); }
}

const dummy = new DummyRepository();

export const repositories = {
  clientes: dummy as unknown as ClienteRepository,
  productos: dummy as unknown as ProductoRepository,
  fiados: dummy as unknown as FiadoRepository,
  pagos: dummy as unknown as PagoRepository,
  ventas: dummy as unknown as VentaRepository,
};
