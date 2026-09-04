-- Migration: Create Database Triggers
-- This migration creates triggers that call the functions from migration 000006.
-- Idempotent: YES (DROP TRIGGER IF EXISTS + CREATE TRIGGER)

-- ============================================================
-- TRIGGER 1: trg_actualizar_saldo_fiado
-- Executes fn_actualizar_saldo_fiado after inserting a pago.
-- ============================================================
DROP TRIGGER IF EXISTS trg_actualizar_saldo_fiado ON pagos;
CREATE TRIGGER trg_actualizar_saldo_fiado
AFTER INSERT ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_saldo_fiado();

-- ============================================================
-- TRIGGER 2: trg_descontar_stock
-- Executes fn_descontar_stock after inserting a detalle_venta line.
-- ============================================================
DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta;
CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

-- ============================================================
-- TRIGGER 3: trg_recalcular_total_venta
-- Executes fn_recalcular_total_venta after inserting a detalle_venta line.
-- ============================================================
DROP TRIGGER IF EXISTS trg_recalcular_total_venta ON detalle_venta;
CREATE TRIGGER trg_recalcular_total_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total_venta();
