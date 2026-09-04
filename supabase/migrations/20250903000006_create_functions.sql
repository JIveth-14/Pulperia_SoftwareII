-- Migration: Create PostgreSQL Functions
-- This migration creates functions that will be used by triggers.
-- Idempotent: YES (CREATE OR REPLACE FUNCTION)

-- ============================================================
-- FUNCTION 1: fn_actualizar_saldo_fiado
-- Triggered when a payment is inserted to update the fiado balance
-- and its estado (pendiente → parcial → pagado).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_saldo_fiado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_saldo  NUMERIC(10,2);
  v_total  NUMERIC(10,2);
BEGIN
  SELECT saldo_pendiente, monto_total
    INTO v_saldo, v_total
    FROM fiados WHERE id = NEW.fiado_id;

  v_saldo := v_saldo - NEW.monto_pagado;

  IF v_saldo < 0 THEN
    RAISE EXCEPTION 'El pago (%) supera el saldo pendiente del fiado (%)',
      NEW.monto_pagado, v_saldo + NEW.monto_pagado;
  END IF;

  UPDATE fiados
     SET saldo_pendiente = v_saldo,
         estado = CASE
                    WHEN v_saldo = 0               THEN 'pagado'
                    WHEN v_saldo < v_total          THEN 'parcial'
                    ELSE                                 'pendiente'
                  END
   WHERE id = NEW.fiado_id;

  RETURN NEW;
END;
$$;

-- ============================================================
-- FUNCTION 2: fn_descontar_stock
-- Triggered when a detalle_venta line is inserted to decrement product stock.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_stock_actual INTEGER;
BEGIN
  SELECT stock INTO v_stock_actual
    FROM productos WHERE id = NEW.producto_id;

  IF v_stock_actual < NEW.cantidad THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto % (disponible: %, solicitado: %)',
      NEW.producto_id, v_stock_actual, NEW.cantidad;
  END IF;

  UPDATE productos
     SET stock = stock - NEW.cantidad
   WHERE id = NEW.producto_id;

  RETURN NEW;
END;
$$;

-- ============================================================
-- FUNCTION 3: fn_recalcular_total_venta
-- Triggered when a detalle_venta line is inserted to recalculate the venta total.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_recalcular_total_venta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ventas
     SET total = (
           SELECT COALESCE(SUM(subtotal), 0)
             FROM detalle_venta
            WHERE venta_id = NEW.venta_id
         )
   WHERE id = NEW.venta_id;

  RETURN NEW;
END;
$$;
