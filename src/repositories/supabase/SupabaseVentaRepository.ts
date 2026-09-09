import type { SupabaseClient } from '@supabase/supabase-js';
import type { LineaVentaInput, TipoPago, Venta, VentaConDetalle } from '../../types';
import type { VentaRepository } from '../VentaRepository';
import { SupabaseProductoRepository } from './SupabaseProductoRepository';
import { SupabaseFiadoRepository } from './SupabaseFiadoRepository';
import { getCacheOrFetch, deleteCacheKeys, getCacheTTL, CACHE_KEYS } from '../../lib/cache';

export class SupabaseVentaRepository implements VentaRepository {
  private productos: SupabaseProductoRepository;
  private fiados: SupabaseFiadoRepository;

  constructor(private supabase: SupabaseClient) {
    this.productos = new SupabaseProductoRepository(supabase);
    this.fiados = new SupabaseFiadoRepository(supabase);
  }

  async getAll(): Promise<Venta[]> {
    const ttl = getCacheTTL('SALES');
    return getCacheOrFetch(CACHE_KEYS.VENTAS_LIST, async () => {
      const { data, error } = await this.supabase
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Venta[];
    }, ttl);
  }

  async getDelDia(): Promise<Venta[]> {
    const ttl = getCacheTTL('SALES', 120); // Shorter TTL for today's sales
    return getCacheOrFetch(CACHE_KEYS.VENTAS_TODAY, async () => {
      const ahora = new Date();
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
      const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1).toISOString();
      const { data, error } = await this.supabase
        .from('ventas')
        .select('*')
        .gte('fecha', inicio)
        .lt('fecha', manana);
      if (error) throw new Error(error.message);
      return data as Venta[];
    }, ttl);
  }

  async getConDetalle(id: number): Promise<VentaConDetalle> {
    const ttl = getCacheTTL('SALES');
    return getCacheOrFetch(CACHE_KEYS.VENTA(id), async () => {
      const { data, error } = await this.supabase
        .from('ventas')
        .select('*, detalle_venta(*, productos(*)), clientes(id, nombre, telefono)')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      const v = data as any;
      return {
        id: v.id,
        cliente_id: v.cliente_id ?? null,
        tipo_pago: v.tipo_pago ?? 'contado',
        total: v.total,
        fecha: v.fecha,
        created_at: v.created_at,
        detalles: v.detalle_venta.map((d: any) => ({ ...d, producto: d.productos })),
        cliente: v.clientes ?? undefined,
      };
    }, ttl);
  }

  async create(
    lineas: LineaVentaInput[],
    clienteId?: number,
    tipoPago: TipoPago = 'contado'
  ): Promise<Venta> {
    // 1. Validar stock client-side
    for (const linea of lineas) {
      const p = await this.productos.getById(linea.producto_id);
      if (p.stock < linea.cantidad) {
        throw new Error(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
      }
    }

    // 2. Crear cabecera
    const { data: ventaData, error: ventaError } = await this.supabase
      .from('ventas')
      .insert({ total: 0, cliente_id: clienteId ?? null, tipo_pago: tipoPago })
      .select()
      .single();
    if (ventaError) throw new Error(ventaError.message);
    const venta = ventaData as Venta;

    // 3. Insertar líneas (los triggers de la BD descuentan stock y recalculan
    // el total de la cabecera). Llevamos también el total en JS como respaldo,
    // por si los triggers de supabase/functions.sql no llegaron a ejecutarse:
    // así el monto del fiado nunca depende únicamente de la BD.
    let totalCalculado = 0;
    for (const linea of lineas) {
      const p = await this.productos.getById(linea.producto_id);
      const subtotal = Number(p.precio) * linea.cantidad;
      totalCalculado += subtotal;
      const { error } = await this.supabase.from('detalle_venta').insert({
        venta_id: venta.id,
        producto_id: linea.producto_id,
        cantidad: linea.cantidad,
        precio_unitario: p.precio,
        subtotal,
      });
      if (error) throw new Error(error.message);
    }

    // 4. Leer venta actualizada (el trigger debería haber calculado el total).
    const { data: updated, error: upError } = await this.supabase
      .from('ventas')
      .select('*')
      .eq('id', venta.id)
      .single();
    if (upError) throw new Error(upError.message);
    let ventaFinal = updated as Venta;

    // Si el total en BD no coincide con el calculado en JS, el trigger
    // trg_recalcular_total_venta probablemente no está instalado: lo
    // corregimos aquí para no dejar la venta con total L 0.00.
    if (Number(ventaFinal.total) !== totalCalculado) {
      const { data: fixed, error: fixError } = await this.supabase
        .from('ventas')
        .update({ total: totalCalculado })
        .eq('id', venta.id)
        .select()
        .single();
      if (!fixError && fixed) ventaFinal = fixed as Venta;
    }

    // 5. Si es fiado, crear el fiado automáticamente con el total calculado
    // (nunca con el valor leído de la BD, para no chocar con el CHECK
    // monto_total > 0 si el total quedó en 0 por falta de triggers).
    if (tipoPago === 'fiado' && clienteId) {
      await this.fiados.create({
        cliente_id: clienteId,
        monto_total: totalCalculado,
      });
    }

    // Invalidate caches
    await this.invalidateVentaCaches(clienteId || undefined);

    return ventaFinal;
  }

  private async invalidateVentaCaches(clienteId?: number): Promise<void> {
    const keysToInvalidate = [
      CACHE_KEYS.VENTAS_LIST,
      CACHE_KEYS.VENTAS_TODAY,
      CACHE_KEYS.PRODUCTS_LIST,
      CACHE_KEYS.PRODUCTS_LOW_STOCK,
      CACHE_KEYS.PRODUCTS_BY_STOCK,
    ];

    if (clienteId) {
      keysToInvalidate.push(CACHE_KEYS.VENTAS_BY_CLIENT(clienteId));
    }

    await deleteCacheKeys(keysToInvalidate);
  }
}