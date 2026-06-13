# Plan de Trabajo — App Móvil Pulpería (React Native + Expo + Supabase)

> Plan paso a paso para construir la app cumpliendo las 3 épicas, el modelo de
> datos y la estrategia de pruebas/despliegue del documento de requisitos.

---

## 0. Estado actual (auditoría)

| Área | Estado |
|------|--------|
| Estructura de carpetas feature-based | ✅ Hecho |
| Expo + TypeScript + entrypoint | ✅ Hecho |
| Dependencias (Navigation, Supabase, AsyncStorage) | ✅ Hecho |
| Cliente Supabase + AuthContext + Navegación | ✅ Hecho (base) |
| Modelo de datos (tipos + SQL) | ❌ Pendiente |
| Services CRUD por módulo | ❌ Pendiente |
| Pantallas funcionales (formularios + listados) | ❌ Pendiente |
| Validaciones de formularios | ❌ Pendiente |
| Alertas de bajo stock (US7) | ❌ Pendiente |
| Cálculo de saldos / pagos parciales (US4) | ❌ Pendiente |
| Testing (unitarias / integración / E2E) | ❌ Pendiente |
| CI/CD + EAS + entornos | ❌ Pendiente |

---

## Mapa de Historias de Usuario → Módulos

| US | Descripción | Épica | Módulo principal |
|----|-------------|-------|------------------|
| US1 | Registrar clientes | 1 | `clientes` |
| US2 | Registrar fiados | 1 | `fiados` |
| US3 | Buscar cliente + ver saldo | 1 | `clientes` |
| US4 | Pagos parciales + historial | 1 | `pagos` |
| US5 | Registrar productos | 2 | `productos` |
| US6 | Actualizar inventario | 2 | `productos` |
| US7 | Alertas de bajo stock | 2 | `productos` / `dashboard` |
| US8 | Registrar ventas + total + descontar stock | 3 | `ventas` |

---

# FASE 0 — Configuración y Base de Datos

### Paso 0.1 — Variables de entorno y conexión Supabase

**Tarea:**
Crear un archivo `.env` en la raíz con las variables `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. Verificar que `src/services/supabase/client.ts`
las lee correctamente y añadir `src/services/supabase/index.ts` que re-exporte el
cliente. Asegurarse de que `.env` esté en `.gitignore`.

> ⚠️ Crear el proyecto en https://supabase.com primero y copiar URL + anon key.

### Paso 0.2 — Esquema de base de datos (PostgreSQL/Supabase)

> ✅ **El esquema YA está definido por el usuario.** Guardarlo tal cual en
> `supabase/schema.sql`. Estructura real (IDs `BIGINT IDENTITY` → `number`):
>
> - `clientes(id, nombre, telefono NOT NULL, direccion, created_at)`
> - `productos(id, nombre, precio, stock, stock_minimo, created_at)`
> - `fiados(id, cliente_id FK→clientes, monto_total, saldo_pendiente, fecha, estado['pendiente'|'parcial'|'pagado'], created_at)`
> - `pagos(id, fiado_id FK→fiados, monto_pagado, fecha_pago, created_at)`
> - `ventas(id, total, fecha, created_at)` — **cabecera**
> - `detalle_venta(id, venta_id FK→ventas, producto_id FK→productos, cantidad, precio_unitario, subtotal)` — **líneas**

**Tarea:**
Guardar el esquema SQL proporcionado en `supabase/schema.sql` sin cambiar nombres
de columnas. Luego añadir en un archivo aparte `supabase/policies.sql` las políticas
RLS para que solo usuarios autenticados puedan leer/escribir en todas las tablas.

### Paso 0.3 — Funciones/triggers SQL para saldos y stock (lógica de negocio en BD)

**Tarea:**
Crear `supabase/functions.sql` con triggers que mantengan la integridad:
1. Trigger en `pagos` (AFTER INSERT): resta `monto_pagado` al `saldo_pendiente` del
   fiado asociado y actualiza estado a `'parcial'` si 0 < saldo < monto_total, o a
   `'pagado'` si el saldo llega a 0.
2. Trigger en `detalle_venta` (AFTER INSERT): descuenta cantidad del stock del
   producto correspondiente.
3. Trigger en `detalle_venta` (AFTER INSERT): recalcula y actualiza el total de la
   venta cabecera (suma de subtotales).

NOTA: `saldo_pendiente` se almacena en la fila del fiado (no se calcula al vuelo);
al crear un fiado, `saldo_pendiente` debe inicializarse igual a `monto_total`.
Documentar cada trigger con comentarios.

### Paso 0.4 — Tipos TypeScript globales del modelo

> ✅ **YA HECHO.** `src/types/index.ts` contiene las interfaces alineadas con el
> esquema real: `Cliente`, `Producto`, `Fiado` (con `cliente_id`, `monto_total`,
> `saldo_pendiente`, `estado`), `Pago` (`fiado_id`), `Venta` (cabecera),
> `DetalleVenta` (líneas), y derivados `ClienteConSaldo`, `VentaConDetalle`,
> más tipos de inserción (`NuevoCliente`, `NuevoFiado`, `LineaVentaInput`, etc.).
> IDs tipados como `number` (BIGINT IDENTITY).

---

# FASE 1 — Épica 1: Clientes y Créditos (Fiados)

### Paso 1.1 — Service y hook de clientes (US1)

**Tarea:**
En el módulo clientes implementar la capa de datos:
- `src/modules/clientes/types/index.ts`: re-exporta `Cliente` y `ClienteConSaldo`.
- `src/modules/clientes/services/clientesService.ts`: funciones async usando
  el cliente Supabase: `getClientes()`, `getClienteById(id)`, `createCliente(data)`,
  `updateCliente(id, data)`, `deleteCliente(id)`, `buscarClientes(nombre)`.
  Para el saldo, `getClientesConSaldo()` debe sumar `fiados.saldo_pendiente` por
  cliente (ese campo ya lo mantiene la BD) y devolver `ClienteConSaldo[]`.
- `src/modules/clientes/hooks/useClientes.ts`: hook con estado (lista, loading,
  error) que consume el service y expone `refetch`.

Manejar errores de red devolviendo mensajes claros (riesgo de conexión).

### Paso 1.2 — Pantalla registrar cliente (US1, TC1)

**Tarea:**
Implementar `src/modules/clientes/screens/ClienteFormScreen.tsx` con un formulario
para registrar/editar un cliente: campos nombre (obligatorio), telefono, direccion.
Validaciones: nombre no vacío. Si el nombre está vacío, mostrar error y no guardar.
Al guardar exitosamente, navegar de vuelta al listado y refrescar.
Usar los colores y spacing de `src/theme`.

### Paso 1.3 — Listado y búsqueda de clientes con saldo (US1, US3, TC4)

**Tarea:**
Reescribir `src/modules/clientes/screens/ClientesScreen.tsx` para que:
- Muestre la lista de clientes con su saldo pendiente (`ClienteConSaldo`).
- Tenga un campo de búsqueda en la parte superior que filtre por nombre.
- Cada item muestre nombre, teléfono y saldo pendiente resaltado.
- Tenga un botón flotante (+) que navegue a `ClienteFormScreen`.
- Al tocar un cliente, navegue a su pantalla de detalle.

Crear un componente reutilizable `src/modules/clientes/components/ClienteCard.tsx`.

### Paso 1.4 — Service y hook de fiados (US2)

**Tarea:**
En el módulo fiados implementar:
- `src/modules/fiados/services/fiadosService.ts`: `getFiadosByCliente(clienteId)`,
  `createFiado({ cliente_id, monto_total })` inicializando `saldo_pendiente =
  monto_total` y `estado = 'pendiente'`, `getFiadoById(id)`. La fecha la asigna la BD.
- `src/modules/fiados/hooks/useFiados.ts`.

Usar los nombres de columna reales (`cliente_id`, `monto_total`, `saldo_pendiente`,
`estado`). Re-exportar los tipos en `src/modules/fiados/types/index.ts`.

### Paso 1.5 — Pantalla registrar fiado (US2, TC2, TC3)

**Tarea:**
Crear `src/modules/fiados/screens/FiadoFormScreen.tsx`:
- Selector del cliente (recibido por parámetro de navegación o seleccionable).
- Campo monto (numérico, obligatorio, > 0).
- Validación TC3: si el monto está vacío o no es válido, mostrar mensaje de
  error y NO guardar.
- Al guardar, registra el fiado y vuelve al detalle del cliente.

### Paso 1.6 — Detalle de cliente con fiados y saldo (US3)

**Tarea:**
Reescribir `src/modules/clientes/screens/ClienteDetailScreen.tsx` para mostrar:
- Datos del cliente.
- Saldo pendiente total (calculado).
- Lista de fiados con su estado (pendiente/pagado) y fecha.
- Botón "Agregar fiado" → `FiadoFormScreen`.
- Botón "Registrar pago" → `PagoFormScreen`.
- Acceso al historial de pagos.

### Paso 1.7 — Pagos parciales e historial (US4, TC5)

**Tarea:**
Implementar el módulo pagos:
- `src/modules/pagos/services/pagosService.ts`: `createPago({ fiado_id, monto_pagado })`,
  `getPagosByFiado(fiadoId)`, `getPagosByCliente(clienteId)`.
- `src/modules/pagos/screens/PagoFormScreen.tsx`: formulario de abono con validación
  (monto > 0 y no mayor al `saldo_pendiente` del fiado). Al guardar, el trigger de la
  BD actualiza `saldo_pendiente` y estado; refrescar la UI para reflejarlo.
- `src/modules/pagos/screens/HistorialPagosScreen.tsx`: lista de pagos con fecha y monto.

Verificar que al pagar el total, el fiado quede en estado `'pagado'` (y `'parcial'` si
queda saldo). Usar nombres de columna reales (`fiado_id`, `monto_pagado`, `fecha_pago`).

### Paso 1.8 — Registrar rutas de la Épica 1 en navegación

**Tarea:**
Actualizar `src/navigation/AppNavigator.tsx` para usar un Stack dentro del tab
"Clientes" que incluya: `ClientesScreen`, `ClienteFormScreen`, `ClienteDetailScreen`,
`FiadoFormScreen`, `PagoFormScreen`, `HistorialPagosScreen`. Tipar correctamente los
parámetros de navegación (param list).

---

# FASE 2 — Épica 2: Inventario

### Paso 2.1 — Service y hook de productos (US5, US6)

**Tarea:**
En el módulo productos implementar:
- `src/modules/productos/services/productosService.ts`: `getProductos()`,
  `createProducto({ nombre, precio, stock, stock_minimo })`, `updateProducto(id, data)`,
  `updateStock(id, nuevoStock)`, `deleteProducto(id)`.
- `src/modules/productos/hooks/useProductos.ts`.
- `src/modules/productos/hooks/useProductosBajoStock.ts`: devuelve productos donde
  `stock <= stock_minimo` (para US7).

Re-exportar tipos.

### Paso 2.2 — Registrar y editar producto (US5, US6)

**Tarea:**
Crear `src/modules/productos/screens/ProductoFormScreen.tsx`:
- Campos: nombre (obligatorio), precio (numérico >= 0), stock (entero >= 0),
  stock_minimo (entero >= 0, default 5).
- Validaciones: nombre no vacío, precio y stock numéricos válidos.
- Sirve para crear y para editar (recibe producto opcional por parámetro).

### Paso 2.3 — Listado de inventario con alerta de bajo stock (US6, US7)

**Tarea:**
Reescribir `src/modules/productos/screens/ProductosScreen.tsx`:
- Lista de productos mostrando nombre, precio y stock.
- Los productos con `stock <= stock_minimo` se muestran con una alerta visual
  (badge o color de advertencia del theme: warning/danger).
- Botón (+) para agregar producto, tocar item → editar.
- La alerta desaparece automáticamente cuando el stock se actualiza por encima
  del mínimo (US7 criterio).

Crear `src/modules/productos/components/ProductoCard.tsx` con el indicador de stock.

### Paso 2.4 — Rutas de productos + alerta en dashboard (US7)

**Tarea:**
1. Actualizar la navegación para que el tab "Productos" use un Stack con
   `ProductosScreen` y `ProductoFormScreen`.
2. En `src/modules/dashboard/screens/DashboardScreen.tsx` mostrar un resumen con:
   - Número de clientes con deuda y total adeudado.
   - Productos con bajo stock (lista corta usando `useProductosBajoStock`).
   - Total de ventas del día.

---

# FASE 3 — Épica 3: Ventas

> ℹ️ **Ventas está normalizada**: cabecera `ventas` + líneas `detalle_venta`.
> Una venta puede incluir **varios productos**. El stock lo descuenta el trigger
> de `detalle_venta`; el `total` de la cabecera lo recalcula otro trigger.

### Paso 3.1 — Service y hook de ventas (US8)

**Tarea:**
En el módulo ventas implementar:
- `src/modules/ventas/services/ventasService.ts`: `createVenta(lineas: LineaVentaInput[])`,
  que: (1) valide stock suficiente de cada producto, (2) inserte la cabecera en
  `ventas`, (3) para cada línea obtenga `precio_unitario` del producto, calcule
  `subtotal = precio_unitario * cantidad` e inserte en `detalle_venta` con el `venta_id`.
  Los triggers de la BD descuentan stock y recalculan el total. Si una inserción
  falla, revertir (idealmente vía RPC/transacción en Supabase).
  `getVentas()`, `getVentaConDetalle(id)`, `getVentasDelDia()`.
- `src/modules/ventas/hooks/useVentas.ts`.

Re-exportar tipos (`Venta`, `DetalleVenta`, `VentaConDetalle`, `LineaVentaInput`).

> 💡 Recomendado: crear una función RPC `registrar_venta(lineas jsonb)` en
> Supabase para hacer toda la operación en una sola transacción atómica.

### Paso 3.2 — Registrar venta (US8, validación de stock)

**Tarea:**
Crear `src/modules/ventas/screens/VentaFormScreen.tsx`:
- Permite agregar varias líneas: por cada una, selector de producto (con stock
  disponible) y cantidad (entero > 0, no mayor al stock).
- Muestra el subtotal de cada línea y el TOTAL de la venta calculado en tiempo real.
- Al guardar, llama a `createVenta` con todas las líneas; el inventario se actualiza
  vía trigger.
- Validación: si alguna cantidad supera el stock, mostrar error y no guardar.

### Paso 3.3 — Listado de ventas y rutas (US8)

**Tarea:**
1. Reescribir `src/modules/ventas/screens/VentasScreen.tsx` con la lista de ventas
   (fecha, total) y el total de ingresos del día arriba. Al tocar una venta,
   mostrar su detalle (productos, cantidades, subtotales).
2. Crear `src/modules/ventas/screens/VentaDetailScreen.tsx` para el detalle.
3. Configurar la navegación del tab "Ventas" con Stack: `VentasScreen` +
   `VentaFormScreen` + `VentaDetailScreen`.

---

# FASE 4 — Robustez y UX (Riesgos / Mitigación)

### Paso 4.1 — Componentes UI reutilizables

**Tarea:**
Crear componentes reutilizables en `src/components/ui`:
- `Button.tsx`, `Input.tsx` (con soporte de error), `Card.tsx`, `EmptyState.tsx`,
  `LoadingSpinner.tsx`, `ErrorMessage.tsx`.
Y en `src/components/common`: `ScreenContainer.tsx` (SafeArea + padding del theme).
Refactorizar las pantallas para usarlos.

### Paso 4.2 — Manejo de errores de conexión y validaciones centralizadas

**Tarea:**
1. Crear `src/utils/validation.ts` con helpers: `requerido(valor)`,
   `esNumeroPositivo(valor)`, `esEnteroPositivo(valor)`.
2. Crear un contexto o componente global que muestre un banner/toast cuando
   ocurra un error de red de Supabase, con mensaje claro (mitigación de riesgo
   de pérdida de conexión).
3. Aplicar las validaciones en todos los formularios.

---

# FASE 5 — Pruebas (Definition of Done)

### Paso 5.1 — Configurar entorno de testing

**Tarea:**
Configurar testing en el proyecto:
- Instalar `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`.
- Añadir el preset `jest-expo` en `package.json` y el script `"test": "jest"`.
- Crear un mock del cliente Supabase en `src/services/supabase/__mocks__`.

### Paso 5.2 — Pruebas unitarias (cálculos y validaciones)

**Tarea:**
Escribir pruebas unitarias para:
- `src/utils/validation.ts` (campos vacíos, montos inválidos).
- Cálculo de saldo de un cliente (suma de `saldo_pendiente` de sus fiados).
- Cálculo de subtotales y total de una venta (`precio_unitario * cantidad`).
- Detección de productos con bajo stock (`stock <= stock_minimo`).
Cubrir los casos de prueba TC1, TC3 y TC5 del documento.

### Paso 5.3 — Pruebas de componentes/integración

**Tarea:**
Escribir pruebas con Testing Library para:
- `ClienteFormScreen`: registrar cliente válido (TC1) y error con nombre vacío.
- `FiadoFormScreen`: error al guardar con monto vacío (TC3).
- `PagoFormScreen`: el saldo se actualiza tras un pago (TC5).
Usar el mock de Supabase.

### Paso 5.4 — (Opcional) E2E

**Tarea:**
Documentar en `TESTING.md` un guion de prueba E2E manual que cubra el flujo completo:
registrar cliente → registrar fiado → registrar pago → verificar saldo en 0.
Si se desea automatizar, explicar cómo integrar Maestro o Detox con Expo.

---

# FASE 6 — Despliegue y CI/CD

### Paso 6.1 — Configurar EAS y entornos

**Tarea:**
Configurar Expo Application Services:
- Crear `eas.json` con perfiles development, preview (staging) y production.
- Documentar en `DEPLOY.md` cómo manejar las variables de entorno por entorno
  (dev / staging / prod) con `EXPO_PUBLIC_*`.
- Explicar los comandos: `eas build --profile preview` y `--profile production`.

### Paso 6.2 — CI/CD con GitHub Actions

**Tarea:**
Crear `.github/workflows/ci.yml` que en cada pull request a main ejecute:
- Instalación de dependencias.
- Lint (configurar ESLint para Expo si no existe).
- `npm test`.
Y un workflow opcional que dispare un build de Expo (preview) al hacer merge en main.
Documentar la estrategia de ramas (feature branches → PR → main) en `CONTRIBUTING.md`.

### Paso 6.3 — Monitoreo y backups

**Tarea:**
1. Documentar en `DEPLOY.md` cómo integrar Sentry (`sentry-expo`) para monitoreo de
   errores en producción.
2. Documentar la estrategia de backups de Supabase (backups automáticos +
   exportación periódica de la base de datos).

---

## Orden recomendado de ejecución

```
FASE 0 (toda)  →  FASE 1 (US1→US2→US3→US4)  →  FASE 2 (US5→US6→US7)
   →  FASE 3 (US8)  →  FASE 4  →  FASE 5  →  FASE 6
```

## Checklist Definition of Done (por funcionalidad)

- [ ] El código funciona sin errores.
- [ ] La información se guarda correctamente en Supabase.
- [ ] Tiene pruebas unitarias y se probó manualmente.
- [ ] Cumple los criterios de aceptación de su historia de usuario.
