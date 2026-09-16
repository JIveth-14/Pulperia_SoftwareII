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
import {
  CachedClienteRepository,
  CachedFiadoRepository,
  CachedPagoRepository,
  CachedProductoRepository,
  CachedVentaRepository,
} from './cached';

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

/** Origen de los datos: base real (Supabase) o datos ficticios de la demo. */
export type ModoDatos = 'real' | 'demo';

/**
 * Factory de producción: repositorios de Supabase envueltos en caché
 * (Decorator). Con `{ cache: false }` se obtienen los repositorios puros.
 */
export function createRepositories(
  supabase: SupabaseClient,
  { cache = true }: { cache?: boolean } = {}
): Repositories {
  const base = {
    clientes: new SupabaseClienteRepository(supabase),
    productos: new SupabaseProductoRepository(supabase),
    fiados: new SupabaseFiadoRepository(supabase),
    pagos: new SupabasePagoRepository(supabase),
    ventas: new SupabaseVentaRepository(supabase),
  };

  if (!cache) return base;

  return {
    clientes: new CachedClienteRepository(base.clientes),
    productos: new CachedProductoRepository(base.productos),
    fiados: new CachedFiadoRepository(base.fiados),
    // Usa los fiados sin caché para leer el cliente de un pago recién hecho.
    pagos: new CachedPagoRepository(base.pagos, base.fiados),
    ventas: new CachedVentaRepository(base.ventas),
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

/**
 * Abstract Factory para Server Components y Server Actions: entrega la
 * familia completa de repositorios según el modo, sin que la página conozca
 * Supabase, la caché o los datos demo.
 */
export async function getRepositories(modo: ModoDatos = 'real'): Promise<Repositories> {
  if (modo === 'demo') return createDemoRepositories();

  // Import dinámico: `next/headers` solo existe en el servidor y la demo no lo necesita.
  const { createClient } = await import('../lib/supabase/server');
  return createRepositories(await createClient());
}
