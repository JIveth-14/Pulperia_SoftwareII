import type { Cliente } from '@/types';
import type { Repositories } from '@/repositories/container';
import {
  validateDireccionOpcional,
  validateNombre,
  validateTelefono,
} from '@/lib/security/validators';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';
import { validarOLanzar } from './validacion';

export interface GuardarClienteEntrada {
  /** Sin id se crea; con id se actualiza. */
  id?: number;
  nombre: unknown;
  telefono: unknown;
  direccion?: unknown;
}

/** Crea o actualiza un cliente. */
export class GuardarCliente implements CasoDeUso<GuardarClienteEntrada, Cliente> {
  constructor(private readonly repos: Pick<Repositories, 'clientes'>) {}

  ejecutar(entrada: GuardarClienteEntrada): Promise<Result<Cliente>> {
    return ejecutar(async () => {
      const datos = validarOLanzar({
        nombre: () => validateNombre(entrada.nombre),
        telefono: () => validateTelefono(entrada.telefono),
        direccion: () => validateDireccionOpcional(entrada.direccion),
      });

      return entrada.id
        ? this.repos.clientes.update(entrada.id, datos)
        : this.repos.clientes.create(datos);
    });
  }
}
