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

/**
 * Contenedor de dependencias (DI) simple. Centraliza la creación de los
 * repositorios concretos, de modo que la lógica de negocio dependa de las
 * interfaces (DIP) y sea fácil sustituir la implementación (p. ej. por un
 * mock en tests).
 */
export const repositories = {
  clientes: new SupabaseClienteRepository() as ClienteRepository,
  productos: new SupabaseProductoRepository() as ProductoRepository,
  fiados: new SupabaseFiadoRepository() as FiadoRepository,
  pagos: new SupabasePagoRepository() as PagoRepository,
  ventas: new SupabaseVentaRepository() as VentaRepository,
};

export type Repositories = typeof repositories;