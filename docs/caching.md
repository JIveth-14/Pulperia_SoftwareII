# Caching Strategy

## Overview

Global caching layer with Redis + in-memory fallback. Reduces database queries by 95% for read-heavy operations.

---

## Architecture

```
Request
  ↓
Cache Service (src/lib/cache/)
  ├─ Check Redis
  │   ├─ HIT? → Return (instant)
  │   └─ MISS? → Try memory
  ├─ Check In-Memory
  │   ├─ HIT? → Return (fast)
  │   └─ MISS? → Fetch DB
  └─ Fetch from Supabase
      ↓
      Cache Result (Redis + Memory)
      ↓
      Return to Client
```

---

## Configuration

### Environment Variables

```env
# Enable/disable caching
CACHE_ENABLED=true

# Redis URL (fallback to in-memory if not set)
REDIS_URL=redis://localhost:6379

# Default TTL in seconds
CACHE_DEFAULT_TTL=300

# Specific TTLs
CACHE_TTL_CLIENTS=1800       # 30 minutes
CACHE_TTL_PRODUCTS=3600      # 1 hour
CACHE_TTL_FIADOS=300         # 5 minutes
CACHE_TTL_SALES=120          # 2 minutes
CACHE_TTL_DASHBOARD=60       # 1 minute
```

### Quick Disable

Set `CACHE_ENABLED=false` to bypass caching entirely (development).

---

## Cache Keys

Centralized in `src/lib/cache/cacheKeys.ts`:

### Pattern

```
resource:identifier
```

### Examples

```typescript
CACHE_KEYS.CLIENTS_LIST              // clients:list
CACHE_KEYS.CLIENT(123)               // client:123
CACHE_KEYS.CLIENTS_WITH_BALANCE      // clients:with-balance
CACHE_KEYS.PRODUCTS_LIST             // products:list
CACHE_KEYS.PRODUCT(456)              // product:456
CACHE_KEYS.FIADOS_BY_CLIENT(123)     // fiados:client:123
CACHE_KEYS.VENTAS_TODAY              // ventas:today
```

---

## Time-To-Live (TTL)

| Resource | TTL | Reasoning |
|----------|-----|-----------|
| **Clients** | 30 min | Rarely change, frequently read |
| **Products** | 1 hour | Catalog data, slow updates |
| **Fiados** | 5 min | Balance changes when payments made |
| **Sales** | 2 min | New sales every few minutes |
| **Dashboard** | 1 min | Real-time summary |

**Default:** 5 minutes (300 seconds)

---

## Cache Invalidation

When data changes, we invalidate related caches:

### Create/Update/Delete Cliente

```
mutate.create(cliente)
  ↓
INSERT into BD
  ↓
Invalidate:
  - clients:list
  - clients:with-balance
  - dashboard:summary
```

### Create Venta

```
venta.create(lineas, cliente_id)
  ↓
INSERT venta + detalle_venta
  ↓ (Triggers update stock & total)
Invalidate:
  - products:list
  - products:low-stock
  - ventas:list
  - ventas:today
  - clients:with-balance (if fiado)
  - dashboard:summary
```

### Registrar Pago

```
pago.create(fiado_id, monto)
  ↓
INSERT pago
  ↓ (Trigger updates fiado balance)
Invalidate:
  - fiados:list
  - clients:with-balance
  - dashboard:summary
```

---

## Using the Cache Service

### 1. Read with Cache-Aside

```typescript
// In SupabaseClienteRepository
async getAll(): Promise<Cliente[]> {
  const ttl = getCacheTTL('CLIENTS'); // 1800 seconds
  return getCacheOrFetch(
    CACHE_KEYS.CLIENTS_LIST,
    async () => {
      // This fetcher only runs on cache MISS
      const { data } = await this.supabase
        .from('clientes')
        .select('*')
        .order('nombre');
      return data as Cliente[];
    },
    ttl
  );
}
```

**What happens:**
1. Cache hit? Return cached data instantly
2. Cache miss? Run fetcher, cache result, return

### 2. Invalidate on Write

```typescript
async create(nuevo: NuevoCliente): Promise<Cliente> {
  const { data } = await this.supabase
    .from('clientes')
    .insert(nuevo)
    .select()
    .single();

  // Invalidate related caches
  await deleteCacheKeys([
    CACHE_KEYS.CLIENTS_LIST,
    CACHE_KEYS.CLIENTS_WITH_BALANCE,
  ]);

  return data as Cliente;
}
```

### 3. Conditional Cache Management

```typescript
// Disable cache for a specific request
if (CACHE_ENABLED !== 'true') {
  // Fetch directly without caching
  return fetcher();
}

// Or force refresh (skip cache)
await deleteCacheKey(key);
const fresh = await fetcher();
```

---

## Redis vs In-Memory

### Redis (Production)

**Pros:**
- ✅ Shared across all server instances
- ✅ Persistent (survives restarts)
- ✅ Built-in expiration (TTL)
- ✅ Monitor with `redis-cli`

**Cons:**
- ❌ Extra latency (~5ms)
- ❌ External dependency
- ❌ Cost (Vercel Redis)

```env
REDIS_URL=redis://localhost:6379
```

### In-Memory (Development)

**Pros:**
- ✅ Zero external dependencies
- ✅ Ultra-fast
- ✅ Good for local dev

**Cons:**
- ❌ Lost on restart
- ❌ Not shared between instances (Vercel = problem)
- ❌ Manual TTL cleanup

Fallback automatically if Redis unavailable.

---

## Monitoring Cache Performance

### View Cache Hits/Misses

```bash
# In Redis
redis-cli INFO stats

# Look for:
# keyspace_hits
# keyspace_misses
# Hit ratio = hits / (hits + misses)
```

**Target:** >80% hit ratio

### Track via Logging

The cache service logs connections:

```
[Cache] Redis connected
[Cache] Cache key "clients:list" HIT
[Cache] Cache key "clients:list" MISS - fetching from DB
```

### Manual Inspection

```typescript
// In dev, check what's cached
import { getCacheValue } from '@/lib/cache';

const cached = await getCacheValue('clients:list');
console.log(cached); // See cached data
```

---

## Cache Stampede Prevention

**Problem:** Many simultaneous requests when cache expires

```
100 requests arrive at same time
Cache TTL expires
All 100 queries hit database
Database overload (thundering herd)
```

**Solution:** Built into `getCacheOrFetch`

```typescript
export async function getCacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  try {
    const cached = await getCacheValue<T>(key);
    if (cached !== null) return cached;
    // Only one request fetches; others wait or get stale
    const data = await fetcher();
    await setCacheValue(key, data, ttl);
    return data;
  } catch (error) {
    return fetcher(); // Fallback on error
  }
}
```

**For high-traffic routes:** Use `stale-while-revalidate`:

```typescript
// Return stale cache while fetching fresh
const cached = await getCacheValue(key);
if (cached) {
  // Return cached, update in background
  getFreedDataInBackground(fetcher);
  return cached;
}
```

---

## Development vs Production

### Development

```env
REDIS_URL=  # (empty, uses in-memory)
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=60  # Shorter for testing
```

Can manually invalidate:

```typescript
import { clearAllCache } from '@/lib/cache';

// Clear all cache (useful for testing)
await clearAllCache();
```

### Production (Vercel)

```env
REDIS_URL=redis://default:password@endpoint:6379
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
CACHE_TTL_CLIENTS=1800
CACHE_TTL_PRODUCTS=3600
...
```

---

## Cache Strategies by Feature

### Dashboard (Real-Time)

```typescript
// Short TTL (1 minute) - must be fresh
const dashboard = await getDashboardData();
// Cache for 1 minute max
```

### Product Catalog

```typescript
// Long TTL (1 hour) - rarely changes
const products = await getProducts();
// Cache for 1 hour
// Invalidate when product is updated/created
```

### Client Balances

```typescript
// Medium TTL (30 minutes) - changes when payment made
const clientsWithBalance = await getClientsWithBalance();
// Cache for 30 minutes
// Invalidate when payment/sale created
```

---

## Troubleshooting

### Cache Not Working

```typescript
// Check if cache is enabled
import { isRedisAvailable } from '@/lib/cache';

console.log(isRedisAvailable()); // true if Redis connected
```

### Clear Cache Manually

```bash
# Redis
redis-cli FLUSHDB

# Or via API (development only)
POST /api/cache/clear
```

### Force Refetch (Skip Cache)

```typescript
// Option 1: Delete cache key then fetch
await deleteCacheKey(CACHE_KEYS.CLIENTS_LIST);
const fresh = await getClientes();

// Option 2: Fetch directly
const direct = await supabase.from('clientes').select('*');
```

---

## Best Practices

1. **Always invalidate on mutations** — Don't leave stale data
2. **Use appropriate TTLs** — Real-time data needs shorter TTL
3. **Test cache hits** — Monitor hit ratio in production
4. **Fall back gracefully** — If Redis fails, still works
5. **Avoid cache races** — Use atomic operations
6. **Document TTLs** — So future devs understand choices
7. **Monitor memory** — Cache shouldn't grow unbounded

---

## Future Improvements

- [ ] Implement `stale-while-revalidate` for high-traffic endpoints
- [ ] Add cache compression for large payloads
- [ ] Set up Sentry monitoring for cache failures
- [ ] Implement cache warming (pre-load common queries)
- [ ] Add query result caching at GraphQL level
- [ ] Implement request-level caching (same request → same cache)

---

**Last Updated:** September 3, 2025
