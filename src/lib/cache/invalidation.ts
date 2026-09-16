import { CACHE_KEYS, getInvalidationKeysForMutation } from './cacheKeys';
import { deleteCacheKeys } from './cacheService';

/**
 * Eventos de dominio que cambian datos cacheados.
 *
 * Mediator: los repositorios solo anuncian *qué pasó*; este módulo decide
 * *qué claves* se invalidan. Así la regla vive en un solo lugar y no se
 * olvidan claves (como pasaba con el saldo del cliente tras un pago).
 */
export type EventoCache =
  | { tipo: 'cliente.creado' }
  | { tipo: 'cliente.actualizado'; clienteId: number }
  | { tipo: 'cliente.eliminado'; clienteId: number }
  | { tipo: 'producto.creado' }
  | { tipo: 'producto.actualizado'; productoId: number }
  | { tipo: 'producto.eliminado'; productoId: number }
  | { tipo: 'fiado.creado'; clienteId: number }
  | { tipo: 'pago.registrado'; fiadoId: number; clienteId: number }
  | { tipo: 'venta.registrada'; productoIds: number[]; clienteId?: number; fiado: boolean };

export function clavesAInvalidar(evento: EventoCache): string[] {
  const claves: string[] = [];

  switch (evento.tipo) {
    case 'cliente.creado':
      claves.push(...getInvalidationKeysForMutation('CLIENTE_MUTATION'));
      break;

    case 'cliente.actualizado':
    case 'cliente.eliminado':
      claves.push(
        ...getInvalidationKeysForMutation('CLIENTE_MUTATION'),
        CACHE_KEYS.CLIENT(evento.clienteId),
        CACHE_KEYS.FIADOS_BY_CLIENT(evento.clienteId),
        CACHE_KEYS.PAGOS_BY_CLIENT(evento.clienteId)
      );
      break;

    case 'producto.creado':
      claves.push(...getInvalidationKeysForMutation('PRODUCTO_MUTATION'));
      break;

    case 'producto.actualizado':
    case 'producto.eliminado':
      claves.push(
        ...getInvalidationKeysForMutation('PRODUCTO_MUTATION'),
        CACHE_KEYS.PRODUCT(evento.productoId)
      );
      break;

    case 'fiado.creado':
      claves.push(
        ...getInvalidationKeysForMutation('FIADO_MUTATION'),
        CACHE_KEYS.FIADOS_BY_CLIENT(evento.clienteId)
      );
      break;

    case 'pago.registrado':
      claves.push(
        ...getInvalidationKeysForMutation('PAGO_MUTATION'),
        CACHE_KEYS.FIADO(evento.fiadoId),
        CACHE_KEYS.PAGOS_BY_FIADO(evento.fiadoId),
        CACHE_KEYS.FIADOS_BY_CLIENT(evento.clienteId),
        CACHE_KEYS.PAGOS_BY_CLIENT(evento.clienteId)
      );
      break;

    case 'venta.registrada':
      claves.push(
        ...getInvalidationKeysForMutation('VENTA_MUTATION'),
        ...evento.productoIds.map((id) => CACHE_KEYS.PRODUCT(id))
      );
      if (evento.clienteId) {
        claves.push(CACHE_KEYS.VENTAS_BY_CLIENT(evento.clienteId));
      }
      if (evento.fiado && evento.clienteId) {
        claves.push(
          ...getInvalidationKeysForMutation('FIADO_MUTATION'),
          CACHE_KEYS.FIADOS_BY_CLIENT(evento.clienteId)
        );
      }
      break;
  }

  return [...new Set(claves)];
}

/** Borra de la caché todo lo afectado por `evento`. */
export async function invalidar(evento: EventoCache): Promise<void> {
  await deleteCacheKeys(clavesAInvalidar(evento));
}
