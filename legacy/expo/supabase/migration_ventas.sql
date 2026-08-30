-- ============================================================
-- MIGRACIÓN: Asociar ventas a clientes y tipo de pago
-- Ejecuta en: https://supabase.com/dashboard/project/yhxmbkojqqffwxrwgdzq/sql/new
-- Elimina este archivo después de ejecutarlo.
-- ============================================================

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS cliente_id BIGINT REFERENCES clientes(id),
  ADD COLUMN IF NOT EXISTS tipo_pago  TEXT NOT NULL DEFAULT 'contado'
    CHECK (tipo_pago IN ('contado', 'fiado'));

-- Fuerza a PostgREST a refrescar su caché de esquema de inmediato
-- (si no, puede tardar unos segundos/minutos en detectar las columnas nuevas).
NOTIFY pgrst, 'reload schema';
