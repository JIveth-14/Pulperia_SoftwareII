'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import type { Cliente, TipoPago } from '@/types';
import { Select, buttonClass } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { formatMoney } from '@/lib/format';
import { BotonEnviar } from './BotonEnviar';
import { useEnvioSinReinicio } from './useEnvioSinReinicio';
import { ErrorFormulario } from './ErrorFormulario';
import {
  CARRITO_VACIO,
  agregar,
  coincide,
  fijarCantidad,
  lineasDelCarrito,
  quitar,
  totalDelCarrito,
  type Carrito,
  type ProductoVenta,
} from './carrito';
import type { AccionFormulario } from './tipos';

interface NuevaVentaFormProps {
  accion: AccionFormulario;
  productos: ProductoVenta[];
  clientes: Pick<Cliente, 'id' | 'nombre'>[];
  /** Cliente preseleccionado (p. ej. desde la ficha del cliente). */
  clienteInicial?: number;
}

export function NuevaVentaForm({ accion, productos, clientes, clienteInicial }: NuevaVentaFormProps) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const alEnviar = useEnvioSinReinicio(enviar);
  const [carrito, setCarrito] = useState<Carrito>(CARRITO_VACIO);
  const [busqueda, setBusqueda] = useState('');
  const [tipoPago, setTipoPago] = useState<TipoPago>(clienteInicial ? 'fiado' : 'contado');
  const [clienteId, setClienteId] = useState(clienteInicial ? String(clienteInicial) : '');

  const visibles = useMemo(
    () => (busqueda ? productos.filter((p) => coincide(p.nombre, busqueda)) : productos),
    [productos, busqueda]
  );
  const enCarrito = productos.filter((p) => carrito[p.id]);
  const total = totalDelCarrito(carrito, productos);
  const lineas = lineasDelCarrito(carrito);

  return (
    <form onSubmit={alEnviar} className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />

      {/* Catálogo */}
      <section className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-4">
          <label htmlFor="buscar-producto" className="sr-only">
            Buscar producto
          </label>
          <input
            id="buscar-producto"
            type="search"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => {
              // Enter agrega el primer resultado en vez de enviar el formulario.
              if (e.key === 'Enter') {
                e.preventDefault();
                const primero = visibles.find((p) => p.stock > (carrito[p.id] ?? 0));
                if (primero) setCarrito((c) => agregar(c, primero));
              }
            }}
            className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {visibles.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">Ningún producto coincide con “{busqueda}”</p>
        ) : (
          <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
            {visibles.map((producto) => {
              const cantidad = carrito[producto.id] ?? 0;
              const agotado = producto.stock === 0;
              const alTope = cantidad >= producto.stock;
              return (
                <li key={producto.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{producto.nombre}</p>
                    <p className="text-xs tabular-nums text-text-secondary">
                      {formatMoney(producto.precio)} ·{' '}
                      <span className={agotado ? 'text-danger' : ''}>
                        {agotado ? 'Agotado' : `${producto.stock} disponibles`}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCarrito((c) => agregar(c, producto))}
                    disabled={agotado || alTope}
                    aria-label={`Agregar ${producto.nombre}`}
                    className={buttonClass('secondary', 'sm', 'shrink-0 tabular-nums')}
                  >
                    {cantidad > 0 ? `+1 (${cantidad})` : 'Agregar'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Resumen */}
      <section className="space-y-4 rounded-lg border border-border bg-surface p-4 lg:sticky lg:top-4">
        <h2 className="text-sm font-medium text-text">Resumen</h2>

        <ErrorFormulario estado={estado} />

        {enCarrito.length === 0 ? (
          <p className="rounded-md border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-secondary">
            Agrega productos del catálogo
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {enCarrito.map((producto) => {
              const cantidad = carrito[producto.id];
              return (
                <li key={producto.id} className="py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm text-text">{producto.nombre}</p>
                    <p className="text-sm font-medium tabular-nums text-text">
                      {formatMoney(Number(producto.precio) * cantidad)}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCarrito((c) => fijarCantidad(c, producto, cantidad - 1))}
                      aria-label={`Quitar uno de ${producto.nombre}`}
                      className={buttonClass('secondary', 'sm', 'w-8')}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={producto.stock}
                      value={cantidad}
                      onChange={(e) => setCarrito((c) => fijarCantidad(c, producto, Number(e.target.value)))}
                      aria-label={`Cantidad de ${producto.nombre}`}
                      className="w-14 rounded-md border border-border-strong bg-surface px-2 py-1 text-center text-sm tabular-nums text-text focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCarrito((c) => agregar(c, producto))}
                      disabled={cantidad >= producto.stock}
                      aria-label={`Agregar uno de ${producto.nombre}`}
                      className={buttonClass('secondary', 'sm', 'w-8')}
                    >
                      +
                    </button>
                    <span className="ml-1 text-xs text-text-secondary">× {formatMoney(producto.precio)}</span>
                    <button
                      type="button"
                      onClick={() => setCarrito((c) => quitar(c, producto))}
                      className="ml-auto text-xs text-text-secondary hover:text-danger"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {estado.campos?.lineas && <p className="text-sm text-danger">{estado.campos.lineas}</p>}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-text">Forma de pago</legend>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            {(['contado', 'fiado'] as const).map((opcion) => (
              <label
                key={opcion}
                className={`cursor-pointer rounded px-3 py-1.5 text-center text-sm transition-colors ${
                  tipoPago === opcion ? 'bg-surface font-medium text-text shadow-[0_0_0_1px_var(--color-border)]' : 'text-text-secondary'
                }`}
              >
                <input
                  type="radio"
                  name="tipoPago"
                  value={opcion}
                  checked={tipoPago === opcion}
                  onChange={() => setTipoPago(opcion)}
                  className="sr-only"
                />
                {opcion === 'contado' ? 'Contado' : 'Al crédito'}
              </label>
            ))}
          </div>
        </fieldset>

        {tipoPago === 'fiado' ? (
          <Select
            id="clienteId"
            name="clienteId"
            label="Cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            error={estado.campos?.clienteId}
          >
            <option value="">Selecciona un cliente…</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>
        ) : (
          <input type="hidden" name="clienteId" value="" />
        )}

        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-text-secondary">Total</span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight text-text">{formatMoney(total)}</span>
        </div>

        <BotonEnviar fullWidth pendiente={enviando} disabled={lineas.length === 0 || (tipoPago === 'fiado' && !clienteId)}>
          Registrar venta
        </BotonEnviar>
        <Link href="/ventas" className="block text-center text-sm text-text-secondary hover:text-text">
          Cancelar
        </Link>
      </section>
    </form>
  );
}
