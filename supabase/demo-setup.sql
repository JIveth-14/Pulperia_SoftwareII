-- ==========================================
-- DEMO DATA SETUP SCRIPT
-- Run this in Supabase SQL Editor to create demo user and sample data
-- ==========================================

-- NOTE: The demo user must be created via Supabase Auth dashboard
-- because we cannot insert directly into auth.users from SQL
--
-- Steps to create demo user:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user"
-- 3. Email: demo@pulperia.test
-- 4. Password: DemoPass123!
-- 5. Click "Save"
--
-- Once demo user is created, run the SQL below to add data

-- ==========================================
-- INSERT DEMO DATA (Run after creating demo user)
-- ==========================================

-- Add demo clients
INSERT INTO clientes (nombre, telefono, direccion, created_at)
VALUES
  ('Juan García López', '66661234', 'Calle Principal #5, Barrio Centro', NOW()),
  ('María Rodríguez Sánchez', '66662345', 'Avenida 2da Este #12', NOW()),
  ('Carlos Antonio Flores', '66663456', 'Calle 5 Poniente #8', NOW()),
  ('Ana María Pérez', '66664567', 'Diagonal Norte #15', NOW())
ON CONFLICT DO NOTHING;

-- Add demo products
INSERT INTO productos (nombre, precio, stock, stock_minimo, created_at)
VALUES
  ('Arroz (Libra)', 1.50, 100, 20, NOW()),
  ('Azúcar (Libra)', 2.00, 80, 15, NOW()),
  ('Huevo Docena', 3.50, 50, 10, NOW()),
  ('Aceite Vegetal (Litro)', 5.00, 40, 8, NOW()),
  ('Leche Entera (Litro)', 2.50, 60, 15, NOW()),
  ('Pan Francés (Unidad)', 0.75, 150, 30, NOW()),
  ('Frijoles Lata', 1.25, 120, 25, NOW()),
  ('Atún Lata', 2.00, 95, 20, NOW()),
  ('Café Molido (Libra)', 4.50, 35, 10, NOW()),
  ('Sal (Libra)', 0.50, 200, 50, NOW())
ON CONFLICT DO NOTHING;

-- Add demo sales (ventas)
INSERT INTO ventas (cliente_id, tipo_pago, total, fecha, created_at)
VALUES
  (1, 'contado', 15.50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  (2, 'fiado', 45.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (3, 'contado', 22.75, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- Add demo sale details (detalle_venta)
INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
SELECT
  v.id,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY v.id) = 1 THEN 1 ELSE 2 END,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY v.id) = 1 THEN 5 ELSE 10 END,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY v.id) = 1 THEN 1.50 ELSE 2.00 END,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY v.id ORDER BY v.id) = 1 THEN 7.50 ELSE 20.00 END
FROM ventas v
WHERE v.created_at > NOW() - INTERVAL '2 days'
ON CONFLICT DO NOTHING;

-- Add demo credits (fiados)
INSERT INTO fiados (cliente_id, monto_total, saldo_pendiente, fecha, estado, created_at)
VALUES
  (2, 45.00, 45.00, NOW() - INTERVAL '1 day', 'pendiente', NOW() - INTERVAL '1 day'),
  (4, 28.50, 18.50, NOW() - INTERVAL '5 days', 'parcial', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Add demo payment (pago)
INSERT INTO pagos (fiado_id, monto_pagado, fecha_pago, created_at)
SELECT
  f.id,
  10.00,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
FROM fiados f
WHERE f.estado = 'parcial'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify demo data
SELECT
  (SELECT COUNT(*) FROM clientes) as cliente_count,
  (SELECT COUNT(*) FROM productos) as producto_count,
  (SELECT COUNT(*) FROM ventas) as venta_count,
  (SELECT COUNT(*) FROM fiados) as fiado_count,
  (SELECT COUNT(*) FROM pagos) as pago_count;
