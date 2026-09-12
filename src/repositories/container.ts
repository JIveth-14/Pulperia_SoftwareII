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
