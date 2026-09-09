-- Migration: Seed Initial Data
-- This migration inserts test/initial data into the database.
-- Idempotent: YES (INSERT ... ON CONFLICT DO NOTHING / DO UPDATE)
-- WARNING: This is test data. Use with caution in production.

-- ==========================================
-- TRUNCATE tables to reset data (only in development)
-- Uncomment if you want to reset: this is unsafe in production!
-- ==========================================
-- TRUNCATE TABLE detalle_venta CASCADE;
-- TRUNCATE TABLE ventas CASCADE;
-- TRUNCATE TABLE pagos CASCADE;
-- TRUNCATE TABLE fiados CASCADE;
-- TRUNCATE TABLE productos CASCADE;
-- TRUNCATE TABLE clientes CASCADE;

-- ==========================================
-- INSERT PRODUCTOS (idempotent: ON CONFLICT DO NOTHING)
-- ==========================================
INSERT INTO productos (nombre, precio, stock, stock_minimo) VALUES
  ('Arroz 1 lb',         12.00,  50,  10),
  ('Frijoles 1 lb',      15.00,  40,  10),
  ('Azúcar 1 lb',        10.00,   3,   8),
  ('Aceite vegetal 1 lt', 65.00, 20,   5),
  ('Sal 1 lb',            5.00,   2,   5),
  ('Leche 1 lt',         35.00,  15,   5),
  ('Café molido 100g',   45.00,  10,   5),
  ('Pan simple',          4.00,  30,  10),
  ('Huevo (c/u)',          6.00,  60,  20),
  ('Refresco 350ml',     18.00,   4,  10),
  ('Jabón de lavar',     22.00,   8,   5),
  ('Papel higiénico',    30.00,  12,   5),
  ('Fósforos',            3.00,  25,   5),
  ('Detergente 500g',    45.00,   9,   5),
  ('Mantequilla 100g',   28.00,  11,   5)
ON CONFLICT DO NOTHING;

-- ==========================================
-- INSERT CLIENTES (idempotent: ON CONFLICT DO NOTHING)
-- ==========================================
INSERT INTO clientes (nombre, telefono, direccion) VALUES
  ('María López',    '9876-5432', 'Colonia El Prado, casa 14'),
  ('José Martínez',  '8765-4321', 'Barrio San Miguel'),
  ('Ana García',     '7654-3210', NULL),
  ('Carlos Reyes',   '6543-2109', 'Aldea Los Pinos'),
  ('Rosa Mendoza',   '5432-1098', 'Col. La Esperanza, bloque B')
ON CONFLICT DO NOTHING;

-- ==========================================
-- INSERT FIADOS (idempotent: ON CONFLICT DO NOTHING)
-- ==========================================
INSERT INTO fiados (cliente_id, monto_total, saldo_pendiente, fecha, estado, created_at) VALUES
  (1, 150.00, 150.00, NOW(), 'pendiente', NOW()),
  (1,  80.00,  80.00, NOW(), 'pendiente', NOW()),
  (2, 200.00, 120.00, NOW(), 'parcial', NOW()),
  (3,  50.00,  50.00, NOW(), 'pendiente', NOW()),
  (4, 300.00,   0.00, NOW(), 'pagado', NOW())
ON CONFLICT DO NOTHING;

-- ==========================================
-- INSERT PAGOS (idempotent: ON CONFLICT DO NOTHING)
-- ==========================================
INSERT INTO pagos (fiado_id, monto_pagado, fecha_pago, created_at) VALUES
  (3, 50.00, CURRENT_DATE - 5, NOW()),
  (3, 30.00, CURRENT_DATE - 2, NOW())
ON CONFLICT DO NOTHING;
