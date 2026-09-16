import type { Venta, VentaConDetalle } from '../../types';
import type { VentaRepository } from '../VentaRepository';
import {
  DEMO_VENTAS,
  DEMO_DETALLE_VENTA,
  DEMO_PRODUCTOS,
  DEMO_CLIENTES,
} from '../../lib/demo/demo-data';
import { DemoReadOnlyError } from './DemoReadOnlyError';
import { NoEncontradoError } from '../../domain/errors';
import { esDelDia } from '../../lib/dates';

/**
 * Implementación en memoria de {@link VentaRepository} para el modo demo.
 */
export class InMemoryVentaRepository implements VentaRepository {
  async getAll(): Promise<Venta[]> {
    return [...DEMO_VENTAS].sort((a, b) => b.id - a.id);
  }

  async getDelDia(): Promise<Venta[]> {
    return DEMO_VENTAS.filter((v) => v.fecha && esDelDia(v.fecha));
  }

  async getConDetalle(id: number): Promise<VentaConDetalle> {
    const venta = DEMO_VENTAS.find((v) => v.id === id);
    if (!venta) throw new NoEncontradoError('Venta', id);

    const detalles = DEMO_DETALLE_VENTA
      .filter((d) => d.venta_id === id)
      .map((d) => ({ ...d, producto: DEMO_PRODUCTOS.find((p) => p.id === d.producto_id) }));

    const cliente = venta.cliente_id
      ? DEMO_CLIENTES.find((c) => c.id === venta.cliente_id)
      : undefined;

    return {
      ...venta,
      detalles,
      cliente: cliente
        ? { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono }
        : undefined,
    };
  }

  async create(): Promise<Venta> {
    throw new DemoReadOnlyError('ventas.create');
  }
}
