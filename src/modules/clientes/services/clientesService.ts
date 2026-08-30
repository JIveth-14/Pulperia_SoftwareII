import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../../types';
import type { ClienteRepository } from '../../../repositories';
import { repositories } from '../../../repositories/container';

/**
 * Servicio de clientes. Depende de la interfaz ClienteRepository (DIP),
 * no de un cliente concreto de base de datos.
 */
export class ClienteService {
  constructor(private repo: ClienteRepository = repositories.clientes) {}

  getClientes(): Promise<Cliente[]> {
    return this.repo.getAll();
  }

  getClienteById(id: number): Promise<Cliente> {
    return this.repo.getById(id);
  }

  getClientesConSaldo(): Promise<ClienteConSaldo[]> {
    return this.repo.getConSaldo();
  }

  buscarClientes(nombre: string): Promise<Cliente[]> {
    return this.repo.buscar(nombre);
  }

  createCliente(nuevo: NuevoCliente): Promise<Cliente> {
    return this.repo.create(nuevo);
  }

  updateCliente(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
    return this.repo.update(id, cambios);
  }

  deleteCliente(id: number): Promise<void> {
    return this.repo.delete(id);
  }
}

// Instancia por defecto compartida.
export const clienteService = new ClienteService();

// Re-export de funciones para compatibilidad con los consumidores actuales.
export const getClientes = () => clienteService.getClientes();
export const getClienteById = (id: number) => clienteService.getClienteById(id);
export const getClientesConSaldo = () => clienteService.getClientesConSaldo();
export const buscarClientes = (nombre: string) => clienteService.buscarClientes(nombre);
export const createCliente = (nuevo: NuevoCliente) => clienteService.createCliente(nuevo);
export const updateCliente = (id: number, cambios: Partial<NuevoCliente>) =>
  clienteService.updateCliente(id, cambios);
export const deleteCliente = (id: number) => clienteService.deleteCliente(id);
