import type { LineaVentaInput, TipoPago, Venta } from '@/types';
import type { Repositories } from '@/repositories/container';
import { StockInsuficienteError, ValidacionError } from '@/domain/errors';
import { ejecutar, type Result } from '@/lib/result';
import type { CasoDeUso } from './CasoDeUso';

export interface RegistrarVentaEntrada {
  lineas: { producto_id: unknown; cantidad: unknown }[];
  tipoPago: unknown;
  clienteId?: unknown;
}

/**
 * Registra una venta de contado o al crédito (fiado).
 *
 * La consistencia (stock, total, fiado) la garantiza la base de datos en una
 * sola transacción (RPC `crear_venta`). Aquí se valida la entrada y se
 * traducen los errores a mensajes con el nombre del producto.
 */
export class RegistrarVenta implements CasoDeUso<RegistrarVentaEntrada, Venta> {
  constructor(private readonly repos: Pick<Repositories, 'ventas' | 'productos' | 'clientes'>) {}

  ejecutar(entrada: RegistrarVentaEntrada): Promise<Result<Venta>> {
    return ejecutar(async () => {
      const { lineas, tipoPago, clienteId } = this.validar(entrada);

      if (clienteId !== undefined) {
        await this.repos.clientes.getById(clienteId); // NoEncontradoError si no existe
      }

      try {
        return await this.repos.ventas.create(lineas, clienteId, tipoPago);
      } catch (error) {
        throw error instanceof StockInsuficienteError ? await this.conNombreDeProducto(error) : error;
      }
    });
  }

  private validar(entrada: RegistrarVentaEntrada): {
    lineas: LineaVentaInput[];
    tipoPago: TipoPago;
    clienteId?: number;
  } {
    const campos: Record<string, string> = {};

    const tipoPago = entrada.tipoPago;
    if (tipoPago !== 'contado' && tipoPago !== 'fiado') {
      campos.tipoPago = 'Selecciona contado o fiado';
    }

    const clienteId = entrada.clienteId === undefined || entrada.clienteId === null || entrada.clienteId === ''
      ? undefined
      : Number(entrada.clienteId);
    if (clienteId !== undefined && !esEnteroPositivo(clienteId)) {
      campos.clienteId = 'Cliente inválido';
    }
    if (tipoPago === 'fiado' && clienteId === undefined) {
      campos.clienteId = 'Una venta al crédito necesita un cliente';
    }

    // Agrupa líneas repetidas del mismo producto.
    const cantidades = new Map<number, number>();
    if (!Array.isArray(entrada.lineas) || entrada.lineas.length === 0) {
      campos.lineas = 'Agrega al menos un producto';
    } else {
      for (const linea of entrada.lineas) {
        const productoId = Number(linea.producto_id);
        const cantidad = Number(linea.cantidad);
        if (!esEnteroPositivo(productoId) || !esEnteroPositivo(cantidad)) {
          campos.lineas = 'Cada producto necesita una cantidad entera mayor a 0';
          break;
        }
        cantidades.set(productoId, (cantidades.get(productoId) ?? 0) + cantidad);
      }
    }

    if (Object.keys(campos).length > 0) {
      throw new ValidacionError('Revisa los datos de la venta', campos);
    }

    return {
      lineas: [...cantidades].map(([producto_id, cantidad]) => ({ producto_id, cantidad })),
      tipoPago: tipoPago as TipoPago,
      clienteId,
    };
  }

  /** La BD reporta "producto 12"; el usuario necesita ver "Arroz 1lb". */
  private async conNombreDeProducto(error: StockInsuficienteError): Promise<StockInsuficienteError> {
    const id = Number(/producto\s+(\d+)/i.exec(error.message)?.[1]);
    if (!esEnteroPositivo(id)) return error;

    try {
      const producto = await this.repos.productos.getById(id);
      const disponible = /disponible:\s*(\d+)/i.exec(error.message)?.[1];
      return new StockInsuficienteError(
        `Stock insuficiente para "${producto.nombre}"${disponible !== undefined ? ` (disponible: ${disponible})` : ''}`,
        { cause: error }
      );
    } catch {
      return error;
    }
  }
}

function esEnteroPositivo(n: number): boolean {
  return Number.isSafeInteger(n) && n > 0;
}
