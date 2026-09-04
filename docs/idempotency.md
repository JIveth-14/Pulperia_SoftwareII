# Idempotency

## What is Idempotency?

An operation is **idempotent** if calling it multiple times has the same effect as calling it once.

### Examples

**Idempotent:**
```
GET /clientes → Always returns same list (if no mutations between)
DELETE /clientes/123 → Can call multiple times safely
PUT /clientes/123 {name: "María"} → Update is idempotent
```

**NOT Idempotent:**
```
POST /clientes {name: "María"} → Creates duplicate if called twice
POST /ventas → Creates duplicate sale
POST /pagos → Creates duplicate payment
```

---

## Why It Matters

### Network Failures

```
User clicks "Create Venta"
    ↓
POST /api/ventas/crear
    ↓
[Network timeout - response never arrives]
    ↓
User retries (client automatically or manual)
    ↓
??? Should NOT create duplicate sale
```

### Browser Refresh

```
User submits form
    ↓
Processing...
    ↓
[User impatient, hits F5]
    ↓
Form re-submitted
    ↓
??? Should NOT create duplicate
```

### Distributed Systems

In Vercel (serverless), same request could hit different instances:

```
POST /api/ventas/crear
    ↓
Instance A: receives request, starts processing
Instance B: receives retry, must recognize same request
    ↓
Should only create ONE sale, not two
```

---

## Strategies

### 1. Database Constraints (Strongest)

**Unique Constraint:**

```sql
-- Prevent duplicate clientes with same email
ALTER TABLE clientes
ADD CONSTRAINT unique_email UNIQUE (email);
```

**Primary Key:**

```sql
-- Each table has id PRIMARY KEY
-- Guarantees uniqueness
```

### 2. Idempotency Keys

A client-generated ID sent with each request:

```typescript
// Client generates
const idempotencyKey = generateUUID();

// Send to server
POST /api/ventas/crear
{
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "lineas": [...],
  "cliente_id": 5,
  "tipo_pago": "contado"
}

// Server stores in database
INSERT INTO venta_requests (idempotency_key, venta_id, status)
VALUES ('550e8400...', 42, 'created');

// Retry with same key? Return cached response
if (idempotencyKeyExists) {
  return getCachedVenta();
}
```

**Pros:**
- ✅ Guarantees exactly-once processing
- ✅ Works across restarts/crashes
- ✅ Client controls request identity

**Cons:**
- ❌ Need extra table for tracking
- ❌ Implementation complexity

### 3. Database Transactions

Make whole operation atomic:

```typescript
// Either all succeed or all fail - no partial state
try {
  await db.transaction(async (tx) => {
    // 1. Create venta
    const venta = await tx.query('INSERT INTO ventas...');

    // 2. Insert detalle_venta
    for (const linea of lineas) {
      await tx.query('INSERT INTO detalle_venta...');
    }

    // 3. Create fiado if needed
    if (tipoPago === 'fiado') {
      await tx.query('INSERT INTO fiados...');
    }

    // All or nothing
  });
} catch (error) {
  // Everything rolled back, no partial state
  throw error;
}
```

**Pros:**
- ✅ Built-in to databases
- ✅ Simple to implement

**Cons:**
- ❌ Doesn't prevent duplicates if client retries
- ❌ Need to track request at app level

### 4. Upsert (INSERT ... ON CONFLICT)

**Approach:** Use `ON CONFLICT` to handle duplicates

```sql
INSERT INTO ventas (id, cliente_id, tipo_pago, total)
VALUES (42, 5, 'contado', 100.00)
ON CONFLICT (id) DO UPDATE SET
  total = EXCLUDED.total,
  updated_at = NOW();
```

**Pros:**
- ✅ Database handles it
- ✅ Simple syntax

**Cons:**
- ❌ Need predictable IDs (not auto-increment)
- ❌ Only for insert, not for complex flows

---

## Current Implementation

### Ventas Creation (Partially Idempotent)

**Current:**

```typescript
// src/repositories/supabase/SupabaseVentaRepository.ts
async create(
  lineas: LineaVentaInput[],
  clienteId?: number,
  tipoPago: TipoPago = 'contado'
): Promise<Venta> {
  // 1. Validate stock (duplicate call is safe)
  for (const linea of lineas) {
    const p = await this.productos.getById(linea.producto_id);
    if (p.stock < linea.cantidad) {
      throw new Error(`Stock insuficiente...`);
    }
  }

  // 2. Create venta header
  const venta = await this.supabase
    .from('ventas')
    .insert({ total: 0, cliente_id: clienteId, tipo_pago: tipoPago })
    .select()
    .single();

  // 3. Create lines
  let totalCalculado = 0;
  for (const linea of lineas) {
    const p = await this.productos.getById(linea.producto_id);
    const subtotal = Number(p.precio) * linea.cantidad;
    totalCalculado += subtotal;

    await this.supabase.from('detalle_venta').insert({
      venta_id: venta.id,
      producto_id: linea.producto_id,
      cantidad: linea.cantidad,
      precio_unitario: p.precio,
      subtotal,
    });
    // Trigger: fn_descontar_stock (decrements stock)
    // Trigger: fn_recalcular_total_venta (recalculates total)
  }

  // 4. If fiado, create fiado
  if (tipoPago === 'fiado' && clienteId) {
    await this.fiados.create({
      cliente_id: clienteId,
      monto_total: totalCalculado,
    });
  }

  // Invalidate caches
  await this.invalidateVentaCaches(clienteId);

  return ventaFinal;
}
```

**Idempotency Analysis:**

| Step | Idempotent? | Why |
|------|-------------|-----|
| Stock validation | ✅ | Read-only, safe to repeat |
| Create venta | ❌ | Each INSERT creates new row |
| Create lines | ❌ | Each INSERT creates duplicates |
| Create fiado | ❌ | Each INSERT creates duplicate |

**Problem:** If network fails after venta created:
```
User creates Venta with 100 total
Network error
User retries
Second venta created (duplicate!)
```

---

## Recommended Improvements

### Phase 1: Add Seed/Idempotency Data

Track processed requests:

```sql
-- Track processed ventas
CREATE TABLE venta_requests (
  id BIGINT PRIMARY KEY,
  idempotency_key UUID UNIQUE NOT NULL,
  venta_id BIGINT REFERENCES ventas(id),
  status VARCHAR(20), -- 'processing', 'created', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);

-- Track processed pagos
CREATE TABLE pago_requests (
  id BIGINT PRIMARY KEY,
  idempotency_key UUID UNIQUE NOT NULL,
  pago_id BIGINT REFERENCES pagos(id),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);
```

### Phase 2: Update API Routes

```typescript
// src/app/api/ventas/crear/route.ts
export async function POST(req: Request) {
  const { lineas, cliente_id, tipo_pago, idempotency_key } = await req.json();

  // Check if already processed
  const existing = await checkIdempotencyKey(idempotency_key);
  if (existing) {
    if (existing.status === 'created') {
      return json({ venta_id: existing.venta_id }); // Return cached response
    }
    if (existing.status === 'failed') {
      return json({ error: existing.error_message }, { status: 400 });
    }
  }

  try {
    // Mark as processing
    await recordIdempotencyKey(idempotency_key, 'processing');

    // Create venta
    const venta = await ventaService.crear(lineas, cliente_id, tipo_pago);

    // Mark as success
    await recordIdempotencyKey(idempotency_key, 'created', venta.id);

    return json({ venta_id: venta.id });
  } catch (error) {
    // Mark as failed
    await recordIdempotencyKey(idempotency_key, 'failed', null, error.message);
    throw error;
  }
}
```

### Phase 3: Client Implementation

```typescript
// src/modules/ventas/services/ventaService.ts
export async function crear(
  lineas: LineaVentaInput[],
  clienteId?: number,
  tipoPago?: TipoPago
): Promise<Venta> {
  const idempotencyKey = generateUUID();

  const response = await fetch('/api/ventas/crear', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      lineas,
      cliente_id: clienteId,
      tipo_pago: tipoPago,
      idempotency_key: idempotencyKey,
    }),
  });

  if (!response.ok) throw new Error('Failed to create venta');
  return response.json();
}
```

---

## Idempotency by Operation

### Safe Operations (Already Idempotent)

| Operation | Why |
|-----------|-----|
| `GET /clientes` | Read-only, no side effects |
| `GET /clientes/:id` | Read-only, no side effects |
| `DELETE /clientes/:id` (idempotent key) | With dedup table |

### Unsafe Operations (Need Work)

| Operation | Required |
|-----------|----------|
| `POST /ventas/crear` | Idempotency key + dedup table |
| `POST /pagos/crear` | Idempotency key + dedup table |
| `POST /clientes/crear` | Unique constraint on email |
| `POST /productos/crear` | Unique constraint on name (optional) |

---

## Testing Idempotency

### Unit Test Example

```typescript
describe('VentaService', () => {
  it('should handle duplicate create requests safely', async () => {
    const idempotencyKey = 'test-key-123';

    // First request
    const venta1 = await ventaService.crear(
      [{ producto_id: 1, cantidad: 2 }],
      5,
      'contado',
      idempotencyKey
    );

    // Second request (same idempotency key)
    const venta2 = await ventaService.crear(
      [{ producto_id: 1, cantidad: 2 }],
      5,
      'contado',
      idempotencyKey
    );

    // Should return same venta_id, not create duplicate
    expect(venta1.id).toBe(venta2.id);

    // Should only have one venta in database
    const ventas = await db.query('SELECT COUNT(*) FROM ventas WHERE cliente_id = 5');
    expect(ventas[0].count).toBe(1);
  });
});
```

---

## Migrations are Idempotent ✅

All migration files use `IF NOT EXISTS` or `CREATE OR REPLACE`:

```sql
-- 000001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 000003_create_tables.sql
CREATE TABLE IF NOT EXISTS clientes (...);

-- 000007_create_triggers.sql
DROP TRIGGER IF EXISTS trg_descontar_stock ON detalle_venta;
CREATE TRIGGER trg_descontar_stock ...;
```

This allows:
- Re-running migrations safely
- Applying same migration to fresh DB
- No "already exists" errors

---

## Best Practices

1. **Always use idempotency keys for mutations** — POST, PUT, DELETE
2. **Track request state** — processing, created, failed
3. **Return cached response** — For duplicate idempotency key
4. **Use unique constraints** — Prevent data duplicates
5. **Use transactions** — All-or-nothing operations
6. **Test failures** — Mock network failures, simulate retries
7. **Log idempotency keys** — For debugging

---

**Last Updated:** September 3, 2025
