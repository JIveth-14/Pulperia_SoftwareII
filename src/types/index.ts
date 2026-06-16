export type ID = number;

export type EstadoFiado = 'pendiente' | 'parcial' | 'pagado';
export type TipoPago    = 'contado' | 'fiado';

// Tabla: clientes
export interface Cliente {
  id: ID;
  nombre: string;
  telefono: string;
  direccion: string | null;
  created_at: string | null;
}

// Tabla: productos
export interface Producto {
  id: ID;
  nombre: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  created_at: string | null;
}

// Tabla: fiados
export interface Fiado {
  id: ID;
  cliente_id: ID;
  monto_total: number;
  saldo_pendiente: number;
  fecha: string | null;
  estado: EstadoFiado | null;
  created_at: string | null;
}

// Tabla: pagos
export interface Pago {
  id: ID;
  fiado_id: ID;
  monto_pagado: number;
  fecha_pago: string | null;
  created_at: string | null;
}

// Tabla: ventas (cabecera)
export interface Venta {
  id: ID;
  cliente_id: ID | null;
  tipo_pago: TipoPago;
  total: number;
  fecha: string | null;
  created_at: string | null;
}

// Tabla: detalle_venta (líneas)
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

export interface ClienteConSaldo extends Cliente {
  saldo: number;
}

export interface VentaConDetalle extends Venta {
  detalles: (DetalleVenta & { producto?: Producto })[];
  cliente?: Pick<Cliente, 'id' | 'nombre' | 'telefono'>;
}

// ==========================================
// Tipos de inserción
// ==========================================

export type NuevoCliente = Pick<Cliente, 'nombre' | 'telefono'> &
  Partial<Pick<Cliente, 'direccion'>>;

export type NuevoProducto = Pick<Producto, 'nombre' | 'precio' | 'stock'> &
  Partial<Pick<Producto, 'stock_minimo'>>;

export type NuevoFiado = Pick<Fiado, 'cliente_id' | 'monto_total'>;

export type NuevoPago = Pick<Pago, 'fiado_id' | 'monto_pagado'>;

export interface LineaVentaInput {
  producto_id: ID;
  cantidad: number;
}
