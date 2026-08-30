-- ============================================================
-- TRIGGER 1: Al insertar un pago, actualiza saldo_pendiente
-- y el estado del fiado asociado.
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

DROP TRIGGER IF EXISTS trg_actualizar_saldo_fiado ON pagos;
CREATE TRIGGER trg_actualizar_saldo_fiado
AFTER INSERT ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_saldo_fiado();

-- ============================================================
-- TRIGGER 2: Al insertar una línea de venta, descuenta stock
-- del producto correspondiente.
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

DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta;
CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

-- ============================================================
-- TRIGGER 3: Al insertar una línea de venta, recalcula el
-- total de la venta cabecera (suma de subtotales).
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

DROP TRIGGER IF EXISTS trg_recalcular_total_venta ON detalle_venta;
CREATE TRIGGER trg_recalcular_total_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total_venta();
