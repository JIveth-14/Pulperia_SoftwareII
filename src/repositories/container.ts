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
import {
  InMemoryClienteRepository,
  InMemoryFiadoRepository,
  InMemoryPagoRepository,
  InMemoryProductoRepository,
  InMemoryVentaRepository,
} from './memory';

/**
 * Conjunto de repositorios que expone la app, tipado por las interfaces de
 * dominio (no por las implementaciones). Cualquier factory que lo produzca
 * —Supabase o en memoria— es intercambiable (DIP + LSP).
 */
export interface Repositories {
  clientes: ClienteRepository;
  productos: ProductoRepository;
  fiados: FiadoRepository;
  pagos: PagoRepository;
  ventas: VentaRepository;
}

/** Factory de producción: repositorios respaldados por Supabase. */
export function createRepositories(supabase: SupabaseClient): Repositories {
  return {
    clientes: new SupabaseClienteRepository(supabase),
    productos: new SupabaseProductoRepository(supabase),
    fiados: new SupabaseFiadoRepository(supabase),
    pagos: new SupabasePagoRepository(supabase),
    ventas: new SupabaseVentaRepository(supabase),
  };
}

/**
 * Factory del modo demo: repositorios en memoria con datos ficticios y solo
 * lectura. Mismo contrato que {@link createRepositories}, de modo que las
 * páginas consumen `Repositories` sin saber cuál implementación reciben.
 */
export function createDemoRepositories(): Repositories {
  return {
    clientes: new InMemoryClienteRepository(),
    productos: new InMemoryProductoRepository(),
    fiados: new InMemoryFiadoRepository(),
    pagos: new InMemoryPagoRepository(),
    ventas: new InMemoryVentaRepository(),
  };
}
