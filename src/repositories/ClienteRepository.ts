import type { Cliente, ClienteConSaldo, NuevoCliente } from '../types';

/**
 * Abstracción de acceso a datos para el dominio de clientes.
 * Permite que la lógica de negocio dependa de esta interfaz y no de un
 * cliente concreto de base de datos (DIP).
 */
export interface ClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: number): Promise<Cliente>;
  getConSaldo(): Promise<ClienteConSaldo[]>;
  buscar(nombre: string): Promise<Cliente[]>;
  create(nuevo: NuevoCliente): Promise<Cliente>;
  update(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente>;
  delete(id: number): Promise<void>;
}