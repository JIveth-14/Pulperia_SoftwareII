-- ============================================================
-- DEMO SEED (OPCIONAL)
-- ============================================================
-- La demo pública (/demo) usa datos EN MEMORIA (src/lib/demo/demo-data.ts)
-- y NO necesita este archivo. Úsalo SOLO si prefieres una demo respaldada
-- por una base de datos Supabase real y aislada.
--
-- Recomendación: crear un PROYECTO/SCHEMA de Supabase aparte para la demo,
-- de modo que estos datos nunca se mezclen con producción.
--
-- Ejecuta en: Supabase Dashboard -> SQL Editor
-- ============================================================

-- (Opcional) Marcar filas como demo, si decides compartir la misma BD.
-- Descomenta si quieres poder filtrar/eliminar los datos demo luego.
-- ALTER TABLE clientes  ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false;
-- ALTER TABLE productos ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false;
-- ALTER TABLE ventas    ADD COLUMN IF NOT EXISTS is_demo_user BOOLEAN DEFAULT false;

-- ------------------------------------------------------------
-- Productos (incluye algunos con stock bajo para las alertas)
-- ------------------------------------------------------------
INSERT INTO productos (nombre, precio, stock, stock_minimo) VALUES
  ('Coca-Cola 600ml',   18.00, 24, 10),
  ('Arroz 1lb',         15.00,  8, 12),   -- bajo stock
  ('Frijoles 1lb',      20.00, 30, 10),
  ('Aceite 500ml',      35.00,  4,  6),   -- bajo stock
  ('Pan de molde',      42.00, 15,  5),
  ('Huevos (cartón)',   95.00,  6,  8),   -- bajo stock
  ('Jabón de baño',     12.00, 40, 15);

-- ------------------------------------------------------------
-- Clientes
-- ------------------------------------------------------------
INSERT INTO clientes (nombre, telefono, direccion) VALUES
  ('María González',   '9876-5432', 'Barrio El Centro, casa #12'),
  ('Carlos Martínez',  '8765-4321', 'Col. Las Flores'),
  ('Ana Rodríguez',    '7654-3210', NULL),
  ('José Hernández',   '6543-2109', 'Frente a la escuela'),
  ('Lucía Fuentes',    '9988-7766', 'Calle principal #45');

-- ------------------------------------------------------------
-- Fiados (saldo_pendiente almacenado en la fila, como el esquema real)
-- ------------------------------------------------------------
INSERT INTO fiados (cliente_id, monto_total, saldo_pendiente, estado) VALUES
  (1, 250.00, 100.00, 'parcial'),
  (1,  80.00,  80.00, 'pendiente'),
  (2, 150.00,   0.00, 'pagado'),
  (4, 300.00, 200.00, 'parcial');

-- ------------------------------------------------------------
-- Pagos
-- ------------------------------------------------------------
INSERT INTO pagos (fiado_id, monto_pagado, fecha_pago) VALUES
  (1, 150.00, CURRENT_DATE - 10),
  (3, 150.00, CURRENT_DATE - 12),
  (4, 100.00, CURRENT_DATE - 2);

-- ------------------------------------------------------------
-- Ventas (cabecera). Si tienes el RPC crear_venta, úsalo en su lugar
-- para que se generen los detalles y se descuente stock automáticamente.
-- ------------------------------------------------------------
INSERT INTO ventas (cliente_id, tipo_pago, total) VALUES
  (NULL, 'contado',  51.00),
  (1,    'fiado',    80.00),
  (NULL, 'contado', 137.00),
  (NULL, 'contado',  36.00);
