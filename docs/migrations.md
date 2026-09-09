# Database Migrations

## Overview

Migrations are SQL files stored in `supabase/migrations/` and executed in order. Each is idempotent, so it can be run multiple times safely.

---

## Migration Files

### Execution Order

```
20250903000001_extensions.sql         ← Create PostgreSQL extensions
20250903000002_enums.sql              ← Define custom types
20250903000003_create_tables.sql      ← Create all tables with columns
20250903000004_add_constraints.sql    ← Add foreign keys, constraints
20250903000005_create_indexes.sql     ← Create performance indexes
20250903000006_create_functions.sql   ← Create PostgreSQL functions
20250903000007_create_triggers.sql    ← Create triggers (call functions)
20250903000008_create_rpc.sql         ← Create RPC functions
20250903000009_enable_rls.sql         ← Enable RLS
20250903000010_create_policies.sql    ← Create RLS policies
20250903000011_seed_data.sql          ← Insert test data
20250903000012_audit_tables.sql       ← Create audit infrastructure
```

---

## Idempotency Guarantees

### 000001: Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Idempotent:** ✅ (IF NOT EXISTS)

---

### 000002: Enums

```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_fiado') THEN
    CREATE TYPE estado_fiado AS ENUM ('pendiente', 'parcial', 'pagado');
  END IF;
END
$$;
```

**Idempotent:** ✅ (DO block with existence check)

---

### 000003: Tables

```sql
CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ...
);
```

**Idempotent:** ✅ (IF NOT EXISTS)

---

### 000004: Constraints

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fiados' AND constraint_name = 'fk_fiado_cliente'
  ) THEN
    ALTER TABLE fiados
    ADD CONSTRAINT fk_fiado_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
        ON DELETE CASCADE;
  END IF;
END
$$;
```

**Idempotent:** ✅ (DO block with existence check)

---

### 000005: Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
```

**Idempotent:** ✅ (IF NOT EXISTS)

---

### 000006: Functions

```sql
CREATE OR REPLACE FUNCTION fn_actualizar_saldo_fiado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  ...
  RETURN NEW;
END;
$$;
```

**Idempotent:** ✅ (CREATE OR REPLACE FUNCTION)

---

### 000007: Triggers

```sql
DROP TRIGGER IF EXISTS trg_actualizar_saldo_fiado ON pagos;
CREATE TRIGGER trg_actualizar_saldo_fiado
AFTER INSERT ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_saldo_fiado();
```

**Idempotent:** ✅ (DROP TRIGGER IF EXISTS + CREATE)

---

### 000008: RPC Functions

```sql
CREATE OR REPLACE FUNCTION crear_venta(...)
RETURNS TABLE (...) LANGUAGE plpgsql AS $$
BEGIN
  ...
END;
$$;

GRANT EXECUTE ON FUNCTION crear_venta TO authenticated;
```

**Idempotent:** ✅ (CREATE OR REPLACE)

---

### 000009: RLS Enable

```sql
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
```

**Idempotent:** ✅ (Idempotent ALTER, fails silently if already enabled)

---

### 000010: RLS Policies

```sql
DROP POLICY IF EXISTS "auth_clientes" ON clientes;
CREATE POLICY "auth_clientes"
  ON clientes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

**Idempotent:** ✅ (DROP POLICY IF EXISTS + CREATE)

---

### 000011: Seed Data

```sql
INSERT INTO productos (nombre, precio, stock, stock_minimo) VALUES
  ('Arroz 1 lb', 12.00, 50, 10),
  (...)
ON CONFLICT DO NOTHING;
```

**Idempotent:** ✅ (ON CONFLICT DO NOTHING)

---

### 000012: Audit Infrastructure

```sql
CREATE TABLE IF NOT EXISTS audit_log (...);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ...;
DROP TRIGGER IF EXISTS trg_audit_clientes ON clientes;
CREATE TRIGGER trg_audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
```

**Idempotent:** ✅ (Combination of IF NOT EXISTS and DROP IF EXISTS)

---

## Running Migrations

### Local Development

```bash
# Start local Supabase
supabase start

# Run all migrations
supabase migration up

# Check status
supabase migration list

# See logs
supabase migration logs
```

### From Scratch

To set up a fresh database from zero:

```bash
# Reset (destructive!)
supabase migration reset

# Run all migrations
supabase migration up

# Verify schema
supabase db pull
```

### Production (Supabase Cloud)

```bash
# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase migration push

# Check status
supabase migration list
```

### Manual Execution

If using SQL directly:

```bash
# Connect to DB
psql postgresql://user:pass@host/database

# Run a single migration
\i supabase/migrations/20250903000001_extensions.sql

# Run all (in order!)
\i supabase/migrations/20250903000001_extensions.sql
\i supabase/migrations/20250903000002_enums.sql
\i supabase/migrations/20250903000003_create_tables.sql
... (and so on)
```

---

## Adding New Migrations

### 1. Create File

```bash
touch supabase/migrations/20250904000013_your_migration.sql
```

**Naming:** `YYYYMMDDhhmmss_description.sql`

### 2. Make it Idempotent

**❌ Bad:**
```sql
CREATE TABLE users (id BIGINT PRIMARY KEY);
```

**✅ Good:**
```sql
CREATE TABLE IF NOT EXISTS users (id BIGINT PRIMARY KEY);
```

**✅ Better (for complex changes):**
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE TABLE users (id BIGINT PRIMARY KEY);
  END IF;
END
$$;
```

### 3. Test Locally

```bash
supabase migration reset  # Clean state
supabase migration up     # Apply all migrations
# Test your changes
supabase migration reset  # Run again to verify idempotency
supabase migration up
```

### 4. Commit

```bash
git add supabase/migrations/20250904000013_your_migration.sql
git commit -m "chore: add migration for your_feature"
git push
```

---

## Reverting Migrations

**⚠️ WARNING:** Supabase doesn't support rolling back individual migrations.

### Option 1: Data-Safe Revert

If you realize a mistake before production:

1. **Edit the migration file** — Fix the issue
2. **Reset locally** — `supabase migration reset`
3. **Re-apply** — `supabase migration up`
4. **Push** — `supabase migration push`

### Option 2: Corrective Migration

If already in production, create a new migration to fix it:

```bash
# After discovering a bug in 000005:
touch supabase/migrations/20250904000013_fix_index_performance.sql
```

Then deploy normally.

---

## Debugging Failed Migrations

### Check Logs

```bash
supabase migration logs

# Or in Supabase dashboard:
# Settings → Migrations
```

### Verify Schema

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check triggers
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_schema = 'public';
```

### Re-run Single Migration

If a migration failed:

```bash
# Run just that file
psql -d database < supabase/migrations/20250903000001_extensions.sql
```

---

## Best Practices

1. **Always use IF NOT EXISTS** — Makes migrations safe to re-run
2. **Keep migrations small** — One concern per file
3. **Test locally first** — `supabase migration reset && supabase migration up`
4. **Document complex changes** — Add comments in migration files
5. **Never modify history** — Don't edit old migration files
6. **Create corrective migrations** — For production fixes
7. **Version control all migrations** — Commit to Git

---

## Common Patterns

### Alter Table Safely

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'email'
  ) THEN
    ALTER TABLE clientes ADD COLUMN email VARCHAR(255);
  END IF;
END
$$;
```

### Add Index Conditionally

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'clientes' AND indexname = 'idx_clientes_email'
  ) THEN
    CREATE INDEX idx_clientes_email ON clientes(email);
  END IF;
END
$$;
```

### Drop Column Safely

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clientes' AND column_name = 'legacy_field'
  ) THEN
    ALTER TABLE clientes DROP COLUMN legacy_field;
  END IF;
END
$$;
```

---

## Seed Data Strategy

Seed data in `000011_seed_data.sql` uses `ON CONFLICT DO NOTHING`:

```sql
INSERT INTO clientes (id, nombre, telefono) VALUES
  (1, 'María López', '9876-5432'),
  (2, 'José Martínez', '8765-4321'),
  ...
ON CONFLICT DO NOTHING;
```

This allows:
- Running seed multiple times (idempotent)
- Manual inserts don't get overwritten
- No duplicate key errors

---

## Monitoring

### Check Migration Status

```bash
supabase migration list

# Output:
# Version  Name                    Status
# 1        000001_extensions       Applied
# 2        000002_enums            Applied
# 3        000003_create_tables    Applied
# ...
```

### View Applied Migrations

```sql
SELECT version, name FROM _supabase_migrations
ORDER BY version;
```

---

**Last Updated:** September 3, 2025
