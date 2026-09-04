-- Migration: Add Constraints and Foreign Keys
-- This migration adds all constraints, foreign keys, and references between tables.
-- Idempotent: YES (ALTER TABLE IF NOT EXISTS / DO blocks)

-- ==========================================
-- FOREIGN KEY: fiados → clientes
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fiados' AND constraint_name = 'fk_fiado_cliente'
  ) THEN
    ALTER TABLE fiados
    ADD CONSTRAINT fk_fiado_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE;
  END IF;
END
$$;

-- ==========================================
-- FOREIGN KEY: pagos → fiados
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'pagos' AND constraint_name = 'fk_pago_fiado'
  ) THEN
    ALTER TABLE pagos
    ADD CONSTRAINT fk_pago_fiado
        FOREIGN KEY (fiado_id)
        REFERENCES fiados(id)
        ON DELETE CASCADE;
  END IF;
END
$$;

-- ==========================================
-- FOREIGN KEY: ventas → clientes
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'ventas' AND constraint_name = 'fk_venta_cliente'
  ) THEN
    ALTER TABLE ventas
    ADD CONSTRAINT fk_venta_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE SET NULL;
  END IF;
END
$$;

-- ==========================================
-- FOREIGN KEY: detalle_venta → ventas
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'detalle_venta' AND constraint_name = 'fk_detalle_venta'
  ) THEN
    ALTER TABLE detalle_venta
    ADD CONSTRAINT fk_detalle_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
        ON DELETE CASCADE;
  END IF;
END
$$;

-- ==========================================
-- FOREIGN KEY: detalle_venta → productos
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'detalle_venta' AND constraint_name = 'fk_detalle_producto'
  ) THEN
    ALTER TABLE detalle_venta
    ADD CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON DELETE RESTRICT;
  END IF;
END
$$;
