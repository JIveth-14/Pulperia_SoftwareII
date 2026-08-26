-- ============================================================
-- RPC: crear_venta (transaccional)
-- Crea una venta (cabecera + detalle), descuenta stock y
-- crea un fiado si aplica. Todo en UNA transacción.
-- ============================================================

CREATE OR REPLACE FUNCTION crear_venta(
  p_lineas JSONB,           -- array de {producto_id, cantidad}
  p_cliente_id BIGINT DEFAULT NULL,
  p_tipo_pago TEXT DEFAULT 'contado'
)
RETURNS TABLE (
  venta_id BIGINT,
  total NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
  v_venta_id BIGINT;
  v_total NUMERIC(10,2) := 0;
  v_linea JSONB;
  v_producto_id BIGINT;
  v_cantidad INTEGER;
  v_precio NUMERIC(10,2);
  v_stock INTEGER;
  v_subtotal NUMERIC(10,2);
BEGIN
  -- 1. Validar y calcular total (sin insertar todavía)
  FOR v_linea IN SELECT * FROM jsonb_array_elements(p_lineas)
  LOOP
    v_producto_id := (v_linea->>'producto_id')::BIGINT;
    v_cantidad := (v_linea->>'cantidad')::INTEGER;

    -- Traer stock y precio
    SELECT stock, precio INTO v_stock, v_precio
      FROM productos WHERE id = v_producto_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto % no existe', v_producto_id;
    END IF;

    IF v_stock < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para producto % (disponible: %, solicitado: %)',
        v_producto_id, v_stock, v_cantidad;
    END IF;

    v_subtotal := v_precio * v_cantidad;
    v_total := v_total + v_subtotal;
  END LOOP;

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'El total de la venta debe ser mayor a 0';
  END IF;

  -- 2. Insertar cabecera
  INSERT INTO ventas (total, cliente_id, tipo_pago, fecha, created_at)
    VALUES (v_total, p_cliente_id, p_tipo_pago, NOW(), NOW())
    RETURNING id INTO v_venta_id;

  -- 3. Insertar líneas (los triggers ya descontarán stock)
  FOR v_linea IN SELECT * FROM jsonb_array_elements(p_lineas)
  LOOP
    v_producto_id := (v_linea->>'producto_id')::BIGINT;
    v_cantidad := (v_linea->>'cantidad')::INTEGER;

    SELECT precio INTO v_precio FROM productos WHERE id = v_producto_id;
    v_subtotal := v_precio * v_cantidad;

    INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES (v_venta_id, v_producto_id, v_cantidad, v_precio, v_subtotal);
  END LOOP;

  -- 4. Si es fiado, crear fiado automáticamente
  IF p_tipo_pago = 'fiado' AND p_cliente_id IS NOT NULL THEN
    INSERT INTO fiados (cliente_id, monto_total, saldo_pendiente, fecha, estado, created_at)
      VALUES (p_cliente_id, v_total, v_total, NOW(), 'pendiente', NOW());
  END IF;

  RETURN QUERY SELECT v_venta_id, v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION crear_venta TO authenticated;
