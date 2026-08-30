-- ==========================================
-- HABILITAR ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS: solo usuarios autenticados
-- ==========================================
CREATE POLICY "auth_clientes"      ON clientes      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_productos"     ON productos     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_fiados"        ON fiados        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_pagos"         ON pagos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_ventas"        ON ventas        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_detalle_venta" ON detalle_venta FOR ALL TO authenticated USING (true) WITH CHECK (true);
