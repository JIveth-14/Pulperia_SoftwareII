# Arquitectura del Sistema

## Visión General

```
┌─────────────────┐
│   Next.js App   │ (Frontend + Server)
│  Pages/Screens  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Hooks   │ (useClientes, useProductos, etc.)
    └────┬─────┘
         │
    ┌────▼──────────┐
    │  Services     │ (ClienteService, VentaService, etc.)
    └────┬──────────┘
         │
    ┌────▼──────────────────┐
    │  Repositories + Cache │ (DIP Pattern)
    └────┬──────────────────┘
         │
    ┌────┴──────┬──────────┐
    │            │          │
 ┌──▼──┐     ┌──▼──┐   ┌──▼──┐
 │Redis│     │Cache│   │Local│
 │     │     │Svc  │   │Mem  │
 └─────┘     └─────┘   └─────┘
         │
    ┌────▼──────────┐
    │   Supabase    │
    │  PostgreSQL   │
    └───────────────┘
```

## Capas

### 1. Presentation Layer (App Router)

**Ubicación:** `src/app/`

- **Server Components** — Fetch inicial, layout, data
- **Client Components** — Interactividad, forms
- **API Routes** — Endpoints HTTP

```typescript
// src/app/(app)/clientes/page.tsx
export default async function ClientesPage() {
  const clientes = await clienteService.getClientes(); // Server fetch
  return <ClientesScreen clientes={clientes} />;
}
```

### 2. Business Logic Layer (Services)

**Ubicación:** `src/modules/*/services/`

Orquestan repositorios y contienen reglas de negocio:

```typescript
// src/modules/clientes/services/clientesService.ts
export class ClienteService {
  constructor(private repo: ClienteRepository) {}

  async getClientes(): Promise<Cliente[]> {
    return this.repo.getAll(); // Delegates to repo + cache
  }

  async createCliente(nuevo: NuevoCliente): Promise<Cliente> {
    const cliente = await this.repo.create(nuevo);
    // Business logic, validations, etc.
    return cliente;
  }
}
```

### 3. Data Access Layer (Repositories)

**Ubicación:** `src/repositories/supabase/`

Implementan interfaces, manejan caché:

```typescript
// src/repositories/supabase/SupabaseClienteRepository.ts
export class SupabaseClienteRepository implements ClienteRepository {
  async getAll(): Promise<Cliente[]> {
    // 1. Try cache
    const cached = await getCacheValue(CACHE_KEYS.CLIENTS_LIST);
    if (cached) return cached;

    // 2. Fetch from DB
    const data = await this.supabase.from('clientes').select('*');

    // 3. Cache for 30 minutes
    await setCacheValue(CACHE_KEYS.CLIENTS_LIST, data, 1800);

    return data;
  }

  async create(nuevo: NuevoCliente): Promise<Cliente> {
    // Insert
    const cliente = await this.supabase
      .from('clientes')
      .insert(nuevo)
      .select()
      .single();

    // Invalidate caches
    await invalidateCaches([
      CACHE_KEYS.CLIENTS_LIST,
      CACHE_KEYS.CLIENTS_WITH_BALANCE,
    ]);

    return cliente;
  }
}
```

### 4. Cache Layer

**Ubicación:** `src/lib/cache/`

Abstracción de Redis con fallback a memoria:

```typescript
// src/lib/cache/cacheService.ts
export async function getCacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try Redis / InMemory
  const cached = await getCacheValue(key);
  if (cached) return cached;

  // Cache miss: fetch
  const data = await fetcher();

  // Store with TTL
  await setCacheValue(key, data, ttl);

  return data;
}
```

### 5. Database Layer

**Ubicación:** PostgreSQL via Supabase

- **Tables:** clientes, productos, ventas, detalle_venta, fiados, pagos
- **Functions:** PostgreSQL functions for RPC
- **Triggers:** fn_descontar_stock, fn_actualizar_saldo_fiado, etc.
- **Policies:** RLS for multi-tenancy (future)

---

## Patrones de Diseño

### 1. Dependency Injection

```typescript
// Create repositories with Supabase client
function createRepositories(supabase: SupabaseClient) {
  return {
    clientes: new SupabaseClienteRepository(supabase),
    productos: new SupabaseProductoRepository(supabase),
    // ... etc
  };
}

// Services depend on interfaces, not implementations
export class ClienteService {
  constructor(private repo: ClienteRepository) {} // DIP!
}
```

### 2. Repository Pattern

Abstract data access behind interfaces:

```typescript
// Interface
export interface ClienteRepository {
  getAll(): Promise<Cliente[]>;
  getById(id: number): Promise<Cliente>;
  create(nuevo: NuevoCliente): Promise<Cliente>;
}

// Implementation
export class SupabaseClienteRepository implements ClienteRepository {
  // ...
}
```

### 3. Cache-Aside

```
Request
  ↓
Check Cache
  ├─ HIT? → Return
  └─ MISS?
      ↓
    Fetch DB
      ↓
    Store in Cache
      ↓
    Return
```

---

## Flujos Críticos

### Crear una Venta (Transaccional)

```
1. User fills VentaForm
     ↓
2. submitVenta() hook
     ↓
3. VentaService.crear(lineas, cliente_id, tipo_pago)
     ↓
4. SupabaseVentaRepository.create()
     ├─ Validate stock (client-side safety check)
     ├─ INSERT into ventas (header)
     ├─ INSERT into detalle_venta (lines)
     │  └─ Triggers:
     │      ├─ fn_descontar_stock (decrement stock)
     │      └─ fn_recalcular_total_venta (sum subtotals)
     ├─ If fiado: INSERT into fiados
     ├─ Invalidate caches:
     │   ├─ products:list
     │   ├─ ventas:list
     │   ├─ clients:with-balance
     │   └─ dashboard:summary
     └─ Return venta_id
     ↓
5. UI updates (refetch or optimistic)
     ↓
6. Show success toast
```

### Pagar un Fiado

```
1. User clicks "Registrar Pago"
     ↓
2. PagoForm submission
     ↓
3. PagoService.registrar(fiado_id, monto)
     ↓
4. SupabasePagoRepository.create()
     ├─ INSERT into pagos
     │  └─ Trigger:
     │      └─ fn_actualizar_saldo_fiado
     │         ├─ Decrement saldo_pendiente
     │         └─ Update estado ('pendiente' → 'parcial' → 'pagado')
     ├─ Invalidate caches:
     │   ├─ fiados:list
     │   ├─ clients:with-balance
     │   └─ dashboard:summary
     └─ Return pago
     ↓
5. UI shows updated fiado status
```

---

## Diferencias Server vs Client

### Server Components (Default)

- Fetch data at build/request time
- Access DB secrets directly
- Zero JS sent to browser
- Cannot use hooks (useState, useEffect, etc.)

```typescript
// src/app/(app)/clientes/page.tsx
export default async function ClientesPage() {
  const clientes = await clienteService.getClientes();
  return <ClientesScreen clientes={clientes} />;
}
```

### Client Components

- Run in browser
- Limited to public APIs
- Can use hooks
- Use for forms, interactivity

```typescript
// src/modules/clientes/screens/ClienteFormScreen.tsx
'use client';

export default function ClienteFormScreen() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (data) => {
    // Client-side form handling
  };
  return // ...;
}
```

---

## Seguridad

### 1. Authentication

- **Supabase Auth** — Email/password
- **Sessions** — Cookies managed by @supabase/ssr
- **Middleware** — Validates on every request

### 2. Row Level Security (RLS)

All tables have RLS enabled:

```sql
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_clientes"
  ON clientes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**⚠️ Current: Basic (all authenticated users can access all data)**

**Future:** More granular (user_id, tenant_id, roles)

### 3. Input Validation

- Server-side in services
- TypeScript types
- Zod/Joi schemas (future)

---

## Performance Considerations

### Caching Strategy

| Resource | TTL | Frequency | Cache? |
|----------|-----|-----------|--------|
| Clients | 30 min | Read 100x | ✅ |
| Products | 1 hour | Read 50x | ✅ |
| Fiados | 5 min | Read 20x | ✅ |
| Sales | 2 min | Read 10x, Write 5x | ✅ |
| Dashboard | 1 min | Read 1x | ✅ |

### Database Optimization

- **Indexes** — 12 indexes on frequent columns
- **Triggers** — Denormalization (calculated fields)
- **Partitioning** — Future (if data grows large)
- **Connection pooling** — Supabase handles

### Frontend Optimization

- **Server Components** — Reduce JS
- **Streaming** — Load UI progressively
- **Image optimization** — Next.js built-in
- **Code splitting** — Automatic

---

## Deployment

### Development

```bash
npm run dev
# Supabase local (optional): supabase start
```

### Production

```bash
npm run build  # Next.js optimized build
npm run start  # Serve production build
```

**See [`deployment.md`](deployment.md) for Vercel instructions.**

---

## Tools & Technologies

| Tool | Purpose | Version |
|------|---------|---------|
| Next.js | Framework | 15.1.6 |
| React | UI Library | 19.0.0 |
| Supabase | Backend | - |
| PostgreSQL | Database | 15 |
| Redis | Cache | 4.6.14 |
| Tailwind | Styling | 4.0.0 |
| Jest | Testing | 30.5.0 |

---

## Diagrama de Dependencias

```
app/
  ├─ Services (no dependencies except repos)
  │   └─ Repositories (depends on Supabase + Cache)
  │       ├─ SupabaseClient
  │       ├─ CacheService
  │       │   ├─ Redis
  │       │   └─ InMemory
  │       └─ Supabase (DB)
  └─ Components
      ├─ Services
      ├─ Hooks
      └─ UI Components
```

---

**Last Updated:** September 3, 2025
