import type { SupabaseClient } from '@supabase/supabase-js';
import type { LineaVentaInput, TipoPago, Venta, VentaConDetalle } from '../../types';
import type { VentaRepository } from '../VentaRepository';
import { rangoDelDia } from '../../lib/dates';
import { lanzarSiError } from './errores';

/** Códigos con los que PostgREST/Postgres indican que la función RPC no existe. */
const RPC_NO_INSTALADO = new Set(['PGRST202', '42883']);

export class SupabaseVentaRepository implements VentaRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAll(): Promise<Venta[]> {
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false });
    lanzarSiError(error, { entidad: 'Venta' });
    return data as Venta[];
  }

  async getDelDia(): Promise<Venta[]> {
    // Día calendario de Honduras, no del servidor (UTC en Vercel).
    const { inicio, fin } = rangoDelDia();
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*')
      .gte('fecha', inicio)
      .lt('fecha', fin);
    lanzarSiError(error, { entidad: 'Venta' });
    return data as Venta[];
  }

  async getConDetalle(id: number): Promise<VentaConDetalle> {
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*, detalle_venta(*, productos(*)), clientes(id, nombre, telefono)')
      .eq('id', id)
      .single();
    lanzarSiError(error, { entidad: 'Venta', id });

    const { detalle_venta, clientes, ...venta } = data as Venta & {
      detalle_venta: (VentaConDetalle['detalles'][number] & { productos?: VentaConDetalle['detalles'][number]['producto'] })[];
      clientes: VentaConDetalle['cliente'] | null;
    };
    return {
      ...venta,
      cliente_id: venta.cliente_id ?? null,
      tipo_pago: venta.tipo_pago ?? 'contado',
      detalles: detalle_venta.map(({ productos, ...d }) => ({ ...d, producto: productos })),
      cliente: clientes ?? undefined,
    };
  }

  /**
   * Crea la venta en una sola transacción con el RPC `crear_venta`
   * (valida stock, inserta cabecera y líneas, descuenta stock y crea el
   * fiado si corresponde). Si todo falla, no queda nada a medias.
   */
  async create(
    lineas: LineaVentaInput[],
    clienteId?: number,
    tipoPago: TipoPago = 'contado'
  ): Promise<Venta> {
    const { data, error } = await this.supabase.rpc('crear_venta', {
      p_lineas: lineas,
      p_cliente_id: clienteId ?? null,
      p_tipo_pago: tipoPago,
    });

    if (error && RPC_NO_INSTALADO.has(error.code)) {
      console.warn(
        '[Ventas] RPC crear_venta no instalado; usando inserción no atómica. ' +
          'Aplica supabase/migrations/20250903000008_create_rpc.sql.'
      );
      return this.createSinRpc(lineas, clienteId, tipoPago);
    }
    lanzarSiError(error, { entidad: 'Venta' });

    const fila = (Array.isArray(data) ? data[0] : data) as { venta_id: number } | null;
    if (!fila) {
      throw new Error('crear_venta no devolvió la venta creada');
    }
    return this.getVenta(fila.venta_id);
  }

  private async getVenta(id: number): Promise<Venta> {
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*')
      .eq('id', id)
      .single();
    lanzarSiError(error, { entidad: 'Venta', id });
    return data as Venta;
  }

  /**
   * Respaldo para bases sin el RPC instalado. No es atómico: si una línea
   * falla, la cabecera ya existe. Los triggers de la BD siguen validando stock.
   */
  private async createSinRpc(
    lineas: LineaVentaInput[],
    clienteId: number | undefined,
    tipoPago: TipoPago
  ): Promise<Venta> {
    const ids = [...new Set(lineas.map((l) => l.producto_id))];
    const { data: productos, error: prodError } = await this.supabase
      .from('productos')
      .select('id, precio')
      .in('id', ids);
    lanzarSiError(prodError, { entidad: 'Producto' });
    const precios = new Map((productos as { id: number; precio: number }[]).map((p) => [p.id, Number(p.precio)]));

    const { data: ventaData, error: ventaError } = await this.supabase
      .from('ventas')
      .insert({ total: 0, cliente_id: clienteId ?? null, tipo_pago: tipoPago })
      .select()
      .single();
    lanzarSiError(ventaError, { entidad: 'Venta' });
    const venta = ventaData as Venta;

    const filas = lineas.map((l) => {
      const precio = precios.get(l.producto_id) ?? 0;
      return {
        venta_id: venta.id,
        producto_id: l.producto_id,
        cantidad: l.cantidad,
        precio_unitario: precio,
        subtotal: precio * l.cantidad,
      };
    });
    const total = filas.reduce((sum, f) => sum + f.subtotal, 0);

    const { error: detError } = await this.supabase.from('detalle_venta').insert(filas);
    lanzarSiError(detError, { entidad: 'Venta' });

    const { data: final, error: upError } = await this.supabase
      .from('ventas')
      .update({ total })
      .eq('id', venta.id)
      .select()
      .single();
    lanzarSiError(upError, { entidad: 'Venta', id: venta.id });

    if (tipoPago === 'fiado' && clienteId) {
      const { error: fiadoError } = await this.supabase
        .from('fiados')
        .insert({ cliente_id: clienteId, monto_total: total, saldo_pendiente: total, estado: 'pendiente' });
      lanzarSiError(fiadoError, { entidad: 'Fiado' });
    }

    return final as Venta;
  }
}
