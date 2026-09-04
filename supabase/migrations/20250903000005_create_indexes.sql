-- Migration: Create Indexes for Performance
-- This migration creates indexes on frequently queried columns.
-- Idempotent: YES (CREATE INDEX IF NOT EXISTS)

-- ==========================================
-- CLIENTES: search and lookup
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);

-- ==========================================
-- PRODUCTOS: stock and lookup
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);

-- ==========================================
-- FIADOS: client lookup and status
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_fiados_cliente_id ON fiados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_fiados_estado ON fiados(estado);

-- ==========================================
-- PAGOS: fiado lookup and date range
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_pagos_fiado_id ON pagos(fiado_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago ON pagos(fecha_pago);

-- ==========================================
-- VENTAS: client and type lookup, date range
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_pago ON ventas(tipo_pago);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);

-- ==========================================
-- DETALLE_VENTA: quick lookups
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta_id ON detalle_venta(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto_id ON detalle_venta(producto_id);
