-- Migration: Create Row Level Security (RLS) Policies
-- This migration creates policies that control access to data.
-- Idempotent: YES (DROP POLICY IF EXISTS + CREATE POLICY)

-- ==========================================
-- Policy for clientes: authenticated users can do everything
-- IMPORTANT: This is a basic policy. Consider more restrictive rules for production.
-- ==========================================
DROP POLICY IF EXISTS "auth_clientes" ON clientes;
CREATE POLICY "auth_clientes"
  ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Policy for productos: authenticated users can do everything
-- ==========================================
DROP POLICY IF EXISTS "auth_productos" ON productos;
CREATE POLICY "auth_productos"
  ON productos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Policy for fiados: authenticated users can do everything
-- ==========================================
DROP POLICY IF EXISTS "auth_fiados" ON fiados;
CREATE POLICY "auth_fiados"
  ON fiados
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Policy for pagos: authenticated users can do everything
-- ==========================================
DROP POLICY IF EXISTS "auth_pagos" ON pagos;
CREATE POLICY "auth_pagos"
  ON pagos
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Policy for ventas: authenticated users can do everything
-- ==========================================
DROP POLICY IF EXISTS "auth_ventas" ON ventas;
CREATE POLICY "auth_ventas"
  ON ventas
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==========================================
-- Policy for detalle_venta: authenticated users can do everything
-- ==========================================
DROP POLICY IF EXISTS "auth_detalle_venta" ON detalle_venta;
CREATE POLICY "auth_detalle_venta"
  ON detalle_venta
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
