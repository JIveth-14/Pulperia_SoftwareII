-- Migration: Enable Row Level Security (RLS)
-- This migration enables RLS on all tables for security.
-- Idempotent: YES (ALTER TABLE IF NOT EXISTS + idempotent checks)

-- ==========================================
-- Enable RLS on all tables
-- ==========================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiados ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;
