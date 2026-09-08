# ADR-001: Selección de Base de Datos de Persistencia

**Estado**: Aceptado  
**Fecha**: 2026-08-29  
**Responsable**: Equipo Desarrollo  

## Contexto

La aplicación Pulpería requiere persistir datos relacionales complejos:
- Clientes con historial de compras
- Productos con stock dinámico
- Ventas normalizadas (cabecera + líneas)
- Fiados (deudas) con pagos parciales
- Auditoría y trazabilidad de transacciones

Requisitos funcionales:
- Integridad referencial (FK entre clientes→fiados→pagos, ventas→detalle_venta→productos)
- Transacciones ACID para operaciones críticas (venta + descuento de stock)
- Triggers automáticos (descuento de stock al vender, actualización de estado de fiado)
- Escalabilidad horizontal (eventual)
- Costo accesible (startup/PYME)

Restricciones técnicas:
- Frontend web (Next.js 15)
- Hosting serverless preferido (Vercel)
- Licencias open-source preferidas
- Equipo desarrollador: 1-2 personas

Alternativas consideradas:
1. **PostgreSQL en Supabase** ← **ELEGIDA**
2. MongoDB (NoSQL)
3. Firebase Realtime Database
4. MySQL en hosting tradicional

## Decisión

**Usar PostgreSQL en Supabase como base de datos principal.**

### Justificación

#### ✅ Ventajas

1. **Integridad de datos**: ACID completo. Las transacciones garantizan que una venta siempre descuenta stock, nunca parcialmente.
   ```sql
   -- Ejemplo: venta descuenta stock atomicamente
   BEGIN TRANSACTION;
   INSERT INTO ventas VALUES (...);
   INSERT INTO detalle_venta VALUES (...);
   UPDATE productos SET stock = stock - cantidad;
   COMMIT;
   ```

2. **Relaciones y constraints**: FK entre clientes-fiados-pagos previene datos huérfanos.
   ```sql
   ALTER TABLE fiados ADD CONSTRAINT fk_cliente
   FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT;
   ```

3. **Triggers para lógica de negocio**: Automatizan reglas sin código en aplicación.
   ```sql
   CREATE TRIGGER actualizar_estado_fiado
   AFTER INSERT ON pagos
   FOR EACH ROW
   BEGIN
     UPDATE fiados SET saldo_pendiente = saldo_pendiente - NEW.monto_pagado
     WHERE id = NEW.fiado_id;
   END;
   ```

4. **Consultas complejas sin N+1**: SQL nativo permite joins eficientes.
   ```sql
   -- Un solo query: cliente + suma de deudas pendientes
   SELECT c.*, SUM(f.saldo_pendiente) as deuda_total
   FROM clientes c
   LEFT JOIN fiados f ON c.id = f.cliente_id
   GROUP BY c.id;
   ```

5. **Supabase**: Hosting gerenciado sin ops.
   - Auto-scaling
   - Backups automáticos
   - Tier gratuito generoso (500MB, 50k filas)
   - Integración nativa con Next.js (auth + DB)
   - SDK TypeScript type-safe

6. **Developer experience**: Supabase proporciona cliente JavaScript con types.
   ```typescript
   const { data, error } = await supabase
     .from('fiados')
     .select('*, pagos(*)')
     .eq('cliente_id', clienteId);
   ```

7. **Costo**: Tier gratuito cubre MVP. Pay-as-you-go escalable ($25-50/mes para PYME).

#### ❌ Desventajas

1. **No es NoSQL**: Requiere schema predefinido. Cambios a estructura = migraciones.
   - *Mitigación*: Pulpería tiene dominio estable; schema no cambiará frecuentemente.

2. **Escalabilidad vertical primero**: PostgreSQL escala mejor verticalmente (RAM, CPU) que horizontalmente.
   - *Mitigación*: Pulpería no aspira a millones de usuarios; un solo servidor Supabase suficiente por años.

3. **Vendor lock-in ligero**: Datos en Supabase, pero PostgreSQL es open-source; migración posible.

4. **Consistencia eventual no nativa**: Si requiere replicación geográfica, es compleja.
   - *Mitigación*: App local; latencia no es crítica.

#### ❌ Desventajas (Alternativas rechazadas)

**MongoDB (NoSQL)**
- ❌ Requiere desnormalización; copias de datos → inconsistencias
- ❌ Sin transacciones ACID nativas (en shards)
- ❌ Más caras a nivel gratuito

**Firebase Realtime Database**
- ❌ No soporta relaciones complejas (no hay FK)
- ❌ Queries limitadas
- ❌ Lock-in fuerte a Google

**MySQL tradicional**
- ❌ Requiere ops (backups, upgrades, seguridad)
- ❌ No integra auth
- ❌ Mayor costo operacional para 1-2 devs

## Consecuencias

### Positivas

1. **Confiabilidad**: Datos siempre consistentes; fiados y stock nunca desincronizados.
2. **Mantenibilidad**: Lógica en triggers (no repetida en múltiples clientes).
3. **Debugging fácil**: SQL directo para auditar problemas.
4. **Seguridad**: Supabase maneja PCI-DSS, backups, encriptación.
5. **Escalabilidad suave**: Desde MVP ($0) a ~50k clientes ($50/mes) sin cambios de código.

### Negativas

1. **Migraciones de esquema**: Cambios futuros requieren `supabase db push` y datos existentes.
2. **Aprendizaje de triggers**: Equipo debe dominar PL/pgSQL si lógica se vuelve compleja.
3. **Overhead inicial**: Diseño de schema correcto desde el inicio (puede ser lento si se repite).

## Ejemplos de Implementación

### Patrón Repository (TypeScript)

```typescript
// modules/clientes/repositories/clientesRepository.ts
interface ClientesRepository {
  crear(cliente: ClienteInput): Promise<Cliente>;
  obtenerPorId(id: number): Promise<Cliente>;
  obtenerTodos(): Promise<Cliente[]>;
  actualizar(id: number, cliente: Partial<ClienteInput>): Promise<Cliente>;
  eliminar(id: number): Promise<void>;
}

export const createClientesRepository = (supabase: SupabaseClient): ClientesRepository => ({
  async crear(cliente) {
    const { data, error } = await supabase
      .from('clientes')
      .insert([cliente])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  // ... más métodos
});
```

### Schema SQL

```sql
-- clientes
CREATE TABLE clientes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL UNIQUE,
  direccion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- fiados
CREATE TABLE fiados (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  monto_total DECIMAL(10, 2) NOT NULL,
  saldo_pendiente DECIMAL(10, 2) NOT NULL,
  estado VARCHAR(20) CHECK (estado IN ('pendiente', 'parcial', 'pagado')),
  fecha DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- pagos con trigger
CREATE TABLE pagos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fiado_id BIGINT NOT NULL REFERENCES fiados(id) ON DELETE CASCADE,
  monto_pagado DECIMAL(10, 2) NOT NULL,
  fecha_pago DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER actualizar_saldo_fiado
AFTER INSERT ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_fiado();
```

## Decisiones Relacionadas

- [[ADR-002-auth.md]] - Autenticación vía Supabase Auth (integrada con PostgreSQL)
- Hosting en Vercel (Next.js + Supabase integrados)

## Referencias

- [Supabase Documentation](https://supabase.io/docs)
- [PostgreSQL ACID Guarantees](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Supabase Pricing](https://supabase.io/pricing)
