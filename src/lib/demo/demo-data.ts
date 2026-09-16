/**
 * Datos semilla ficticios EN MEMORIA para el modo demo.
 *
 * Tipados con las mismas interfaces que la app real (`src/types`). Este módulo
 * SOLO expone los datasets; el acceso a datos se hace a través de los
 * repositorios en memoria (`src/repositories/memory`), que implementan las
 * mismas interfaces que los repositorios de Supabase. Así el demo y producción
 * comparten exactamente el mismo contrato (DIP) y las mismas páginas pueden
 * consumir cualquiera de las dos implementaciones (LSP).
 */

import type {
  Cliente,
  Producto,
  Fiado,
  Pago,
  Venta,
  DetalleVenta,
} from '@/types';

// Fecha base estable para que la demo se vea consistente.
const HOY = new Date();
const iso = (d: Date) => d.toISOString();
const diasAtras = (n: number) => iso(new Date(HOY.getTime() - n * 24 * 60 * 60 * 1000));

// ==========================================
// Clientes
// ==========================================
export const DEMO_CLIENTES: Cliente[] = [
  { id: 1, nombre: 'María González', telefono: '9876-5432', direccion: 'Barrio El Centro, casa #12', created_at: diasAtras(40) },
  { id: 2, nombre: 'Carlos Martínez', telefono: '8765-4321', direccion: 'Col. Las Flores', created_at: diasAtras(30) },
  { id: 3, nombre: 'Ana Rodríguez', telefono: '7654-3210', direccion: null, created_at: diasAtras(25) },
  { id: 4, nombre: 'José Hernández', telefono: '6543-2109', direccion: 'Frente a la escuela', created_at: diasAtras(15) },
  { id: 5, nombre: 'Lucía Fuentes', telefono: '9988-7766', direccion: 'Calle principal #45', created_at: diasAtras(5) },
];

// ==========================================
// Productos
// ==========================================
export const DEMO_PRODUCTOS: Producto[] = [
  { id: 1, nombre: 'Coca-Cola 600ml', precio: 18, stock: 24, stock_minimo: 10, created_at: diasAtras(40) },
  { id: 2, nombre: 'Arroz 1lb', precio: 15, stock: 8, stock_minimo: 12, created_at: diasAtras(40) },
  { id: 3, nombre: 'Frijoles 1lb', precio: 20, stock: 30, stock_minimo: 10, created_at: diasAtras(38) },
  { id: 4, nombre: 'Aceite 500ml', precio: 35, stock: 4, stock_minimo: 6, created_at: diasAtras(35) },
  { id: 5, nombre: 'Pan de molde', precio: 42, stock: 15, stock_minimo: 5, created_at: diasAtras(20) },
  { id: 6, nombre: 'Huevos (cartón)', precio: 95, stock: 6, stock_minimo: 8, created_at: diasAtras(10) },
  { id: 7, nombre: 'Jabón de baño', precio: 12, stock: 40, stock_minimo: 15, created_at: diasAtras(8) },
];

// ==========================================
// Fiados (con saldo almacenado en la fila, como el esquema real)
// ==========================================
export const DEMO_FIADOS: Fiado[] = [
  { id: 1, cliente_id: 1, monto_total: 250, saldo_pendiente: 100, fecha: diasAtras(20), estado: 'parcial', created_at: diasAtras(20) },
  { id: 2, cliente_id: 1, monto_total: 80, saldo_pendiente: 80, fecha: diasAtras(3), estado: 'pendiente', created_at: diasAtras(3) },
  { id: 3, cliente_id: 2, monto_total: 150, saldo_pendiente: 0, fecha: diasAtras(18), estado: 'pagado', created_at: diasAtras(18) },
  { id: 4, cliente_id: 4, monto_total: 300, saldo_pendiente: 200, fecha: diasAtras(6), estado: 'parcial', created_at: diasAtras(6) },
];

// ==========================================
// Pagos
// ==========================================
export const DEMO_PAGOS: Pago[] = [
  { id: 1, fiado_id: 1, monto_pagado: 150, fecha_pago: diasAtras(10), created_at: diasAtras(10) },
  { id: 2, fiado_id: 3, monto_pagado: 150, fecha_pago: diasAtras(12), created_at: diasAtras(12) },
  { id: 3, fiado_id: 4, monto_pagado: 100, fecha_pago: diasAtras(2), created_at: diasAtras(2) },
];

// ==========================================
// Ventas (cabecera + detalle)
// ==========================================
export const DEMO_VENTAS: Venta[] = [
  { id: 1, cliente_id: null, tipo_pago: 'contado', total: 51, fecha: diasAtras(0), created_at: diasAtras(0) },
  { id: 2, cliente_id: 1, tipo_pago: 'fiado', total: 80, fecha: diasAtras(0), created_at: diasAtras(0) },
  { id: 3, cliente_id: null, tipo_pago: 'contado', total: 137, fecha: diasAtras(1), created_at: diasAtras(1) },
  { id: 4, cliente_id: null, tipo_pago: 'contado', total: 36, fecha: diasAtras(2), created_at: diasAtras(2) },
];

export const DEMO_DETALLE_VENTA: DetalleVenta[] = [
  { id: 1, venta_id: 1, producto_id: 1, cantidad: 2, precio_unitario: 18, subtotal: 36 },
  { id: 2, venta_id: 1, producto_id: 7, cantidad: 1, precio_unitario: 12, subtotal: 12 },
  { id: 3, venta_id: 1, producto_id: 2, cantidad: 1, precio_unitario: 15, subtotal: 15 },
  { id: 4, venta_id: 2, producto_id: 5, cantidad: 1, precio_unitario: 42, subtotal: 42 },
  { id: 5, venta_id: 2, producto_id: 4, cantidad: 1, precio_unitario: 35, subtotal: 35 },
  { id: 6, venta_id: 3, producto_id: 6, cantidad: 1, precio_unitario: 95, subtotal: 95 },
  { id: 7, venta_id: 3, producto_id: 3, cantidad: 2, precio_unitario: 20, subtotal: 40 },
  { id: 8, venta_id: 4, producto_id: 3, cantidad: 1, precio_unitario: 20, subtotal: 20 },
  { id: 9, venta_id: 4, producto_id: 1, cantidad: 1, precio_unitario: 18, subtotal: 18 },
];
