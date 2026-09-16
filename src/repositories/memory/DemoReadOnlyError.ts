import { DomainError } from '../../domain/errors';

/**
 * Error lanzado cuando se intenta una mutación en el modo demo.
 *
 * La demo es de solo lectura. Además de deshabilitar los botones en la UI,
 * los repositorios en memoria lanzan este error en create/update/delete, de
 * modo que la restricción vive también en la capa de datos (defensa en
 * profundidad): aunque una página futura llame a una mutación por error, nunca
 * se altera el estado demo.
 */
export class DemoReadOnlyError extends DomainError {
  constructor(operacion: string) {
    super('DEMO_SOLO_LECTURA', `Operación no permitida en modo demo (solo lectura): ${operacion}`);
    this.name = 'DemoReadOnlyError';
  }
}
