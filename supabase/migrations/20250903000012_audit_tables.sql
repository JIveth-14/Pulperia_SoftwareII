-- Migration: Create Audit Tables and Functions
-- This migration creates audit tables to track changes to critical tables.
-- Idempotent: YES (CREATE TABLE IF NOT EXISTS)

-- ==========================================
-- AUDIT TABLE: Tracks all modifications to critical tables
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW(),
    ip_address INET
);

-- ==========================================
-- INDEX for audit_log
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);

-- ==========================================
-- FUNCTION: fn_audit_trigger
-- Logs changes to audit_log table
-- ==========================================
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, changed_at)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), NOW());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data, changed_at)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, record_id, new_data, changed_at)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), NOW());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- ==========================================
-- TRIGGERS: Log changes to critical tables
-- ==========================================
DROP TRIGGER IF EXISTS trg_audit_clientes ON clientes;
CREATE TRIGGER trg_audit_clientes
AFTER INSERT OR UPDATE OR DELETE ON clientes
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_productos ON productos;
CREATE TRIGGER trg_audit_productos
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_ventas ON ventas;
CREATE TRIGGER trg_audit_ventas
AFTER INSERT OR UPDATE OR DELETE ON ventas
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

DROP TRIGGER IF EXISTS trg_audit_fiados ON fiados;
CREATE TRIGGER trg_audit_fiados
AFTER INSERT OR UPDATE OR DELETE ON fiados
FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
