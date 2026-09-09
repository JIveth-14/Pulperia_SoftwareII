-- Migration: Create Enumerated Types
-- This migration creates ENUM types for estado_fiado and tipo_pago.
-- Idempotent: YES (DO block with exception handling)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_fiado') THEN
    CREATE TYPE estado_fiado AS ENUM ('pendiente', 'parcial', 'pagado');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_pago') THEN
    CREATE TYPE tipo_pago AS ENUM ('contado', 'fiado');
  END IF;
END
$$;
