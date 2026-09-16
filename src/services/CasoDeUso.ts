import type { Result } from '@/lib/result';

/**
 * Command: cada operación de negocio es un objeto con un único `ejecutar`.
 * Recibe sus dependencias (repositorios) por constructor, valida la entrada
 * y devuelve un `Result` en vez de lanzar, listo para una Server Action.
 */
export interface CasoDeUso<Entrada, Salida> {
  ejecutar(entrada: Entrada): Promise<Result<Salida>>;
}
