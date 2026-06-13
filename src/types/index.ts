// ==========================================
// Tipos del modelo de datos (Supabase / PostgreSQL)
// Los IDs son BIGINT IDENTITY -> number en TypeScript.
// Los nombres de campos coinciden EXACTAMENTE con las columnas de la BD.
// ==========================================

export type ID = number;

export type EstadoFiado = 'pendiente' | 'parcial' | 'pagado';

// Tabla: clientes
export interface Cliente {
  id: ID;
  nombre: string;
  telefono: string; // NOT NULL en la BD
  direccion: string | null;
  created_at: string;
}

// Tabla: productos
export interface Producto {
  id: ID;
  nombre: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  created_at: string;
}

// Tabla: fiados
export interface Fiado {
  id: ID;
  cliente_id: ID;
  monto_total: number;
  saldo_pendiente: number;
  fecha: string;
  estado: EstadoFiado;
  created_at: string;
}

// Tabla: pagos
export interface Pago {
  id: ID;
  fiado_id: ID;
  monto_pagado: number;
  fecha_pago: string;
  created_at: string;
}

// Tabla: ventas (cabecera)
export interface Venta {
  id: ID;
  total: number;
  fecha: string;
  created_at: string;
}

// Tabla: detalle_venta (líneas de la venta)
export interface DetalleVenta {
  id: ID;
  venta_id: ID;
  producto_id: ID;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// ==========================================
// Tipos derivados / de UI
// ==========================================

// Cliente con su saldo total pendiente (suma de saldo_pendiente de sus fiados)
export interface ClienteConSaldo extends Cliente {
  saldo: number;
}

// Venta con sus líneas y datos de producto para mostrar/registrar
export interface VentaConDetalle extends Venta {
  detalles: (DetalleVenta & { producto?: Producto })[];
}

// Tipos para insertar (sin columnas generadas por la BD)
export type NuevoCliente = Pick<Cliente, 'nombre' | 'telefono'> &
  Partial<Pick<Cliente, 'direccion'>>;

export type NuevoProducto = Pick<
  Producto,
  'nombre' | 'precio' | 'stock'
> &
  Partial<Pick<Producto, 'stock_minimo'>>;

export type NuevoFiado = Pick<Fiado, 'cliente_id' | 'monto_total'>;

export type NuevoPago = Pick<Pago, 'fiado_id' | 'monto_pagado'>;

// Una línea de venta antes de registrarse (el total/subtotal se calculan)
export interface LineaVentaInput {
  producto_id: ID;
  cantidad: number;
}
