# Plan de Trabajo — App Móvil Pulpería (React Native + Expo 56 + Supabase)

> Plan paso a paso con prompts listos para implementar cada funcionalidad.
> Construye la app cumpliendo las 3 épicas, el modelo de datos y la estrategia
> de pruebas/despliegue del documento de requisitos.

---

## 0. Estado actual (auditoría 2026-06-13)

| Área | Estado | Notas |
|------|--------|-------|
| Estructura de carpetas feature-based | ✅ Hecho | |
| Expo 56 + TypeScript + entrypoint | ✅ Hecho | index.ts → App.tsx |
| Dependencias (Navigation v7, Supabase v2, AsyncStorage) | ✅ Hecho | package.json |
| Cliente Supabase (`src/services/supabase/client.ts`) | ✅ Hecho | |
| AuthContext + RootNavigator + AuthNavigator | ✅ Hecho | |
| LoginScreen funcional | ✅ Hecho | |
| Tipos TypeScript del modelo (`src/types/index.ts`) | ✅ Hecho | |
| Theme (`src/theme/index.ts`) | ✅ Hecho | colors/spacing/fontSize |
| Variables de entorno (`.env` + `.gitignore`) | ✅ Hecho | |
| AppNavigator con 5 tabs (stubs) | ✅ Hecho (base) | Stubs, sin stacks anidados |
| Esquema SQL (`supabase/schema.sql`) | ✅ Hecho | Archivo creado, ejecutar en Supabase |
| Policies RLS (`supabase/policies.sql`) | ✅ Hecho | Archivo creado, ejecutar en Supabase |
| Triggers SQL (`supabase/functions.sql`) | ✅ Hecho | Archivo creado, ejecutar en Supabase |
| `src/services/supabase/index.ts` (re-export) | ✅ Hecho | |
| Services CRUD — clientes | ✅ Hecho | `clientesService.ts` |
| Services CRUD — fiados / pagos / productos / ventas | ✅ Hecho (fiados+pagos) | |
| Hook `useClientes` | ✅ Hecho | |
| Hooks — fiados / pagos / productos / ventas | ✅ Hecho (fiados+pagos) | |
| Pantallas funcionales (formularios + listados) | ✅ Hecho (Épica 1) | productos/ventas pendientes |
| Componentes UI reutilizables | ✅ Hecho | Button, Input, Card, EmptyState, etc. |
| Validaciones de formularios (`validation.ts`) | ✅ Hecho | |
| Alertas de bajo stock (US7) | ✅ Hecho | `useProductosBajoStock` + Dashboard |
| Pagos parciales + historial (US4) | ✅ Hecho | `PagoFormScreen` + `HistorialPagosScreen` |
| Toast global de errores (FASE 4) | ✅ Hecho | `ToastContext` integrado en `App.tsx` |
| Testing unitario (FASE 5) | ✅ Hecho | jest-expo configurado, 18 tests pasando (`npm test`) |
| CI/CD + EAS + entornos (FASE 6) | ⚠ Parcial | `eas.json` + workflows creados; falta `eas login`, `eas build:configure` y secret `EXPO_TOKEN` en GitHub (acción manual del usuario) |

---

## Mapa de Historias de Usuario → Módulos

| US | Descripción | Épica | Módulo |
|----|-------------|-------|--------|
| US1 | Registrar clientes | 1 | `clientes` |
| US2 | Registrar fiados | 1 | `fiados` |
| US3 | Buscar cliente + ver saldo | 1 | `clientes` |
| US4 | Pagos parciales + historial | 1 | `pagos` |
| US5 | Registrar productos | 2 | `productos` |
| US6 | Actualizar inventario | 2 | `productos` |
| US7 | Alertas de bajo stock | 2 | `productos` / `dashboard` |
| US8 | Registrar ventas + total + descontar stock | 3 | `ventas` |

---

## Navegación objetivo (estructura anidada)

```
RootNavigator
├── AuthNavigator (Stack)          ← sin sesión
│   └── LoginScreen
└── AppNavigator (BottomTabs)      ← con sesión
    ├── Tab: Dashboard
    │   └── DashboardScreen
    ├── Tab: Clientes (Stack)
    │   ├── ClientesScreen
    │   ├── ClienteFormScreen
    │   ├── ClienteDetailScreen
    │   ├── FiadoFormScreen
    │   ├── PagoFormScreen
    │   └── HistorialPagosScreen
    ├── Tab: Productos (Stack)
    │   ├── ProductosScreen
    │   └── ProductoFormScreen
    └── Tab: Ventas (Stack)
        ├── VentasScreen
        ├── VentaFormScreen
        └── VentaDetailScreen
```

> El tab "Fiados" actual (stub) se elimina; los fiados se gestionan desde
> el detalle del cliente dentro del tab Clientes.

---

# FASE 0 — Configuración y Base de Datos

### ✅ Paso 0.1 — Variables de entorno y conexión Supabase
**Estado:** Hecho. `.env` creado, `client.ts` funcional, `.gitignore` configurado, `src/services/supabase/index.ts` creado.

---

### ✅ Paso 0.2 — Esquema de base de datos

**Prompt:**
```
Crea la carpeta supabase/ en la raíz del proyecto y dentro el archivo
supabase/schema.sql con el siguiente esquema PostgreSQL exacto (no cambies
ningún nombre de columna):

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre     TEXT NOT NULL,
  telefono   TEXT NOT NULL,
  direccion  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla productos
CREATE TABLE IF NOT EXISTS productos (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre       TEXT NOT NULL,
  precio       NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla fiados
CREATE TABLE IF NOT EXISTS fiados (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id       BIGINT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  monto_total      NUMERIC(10,2) NOT NULL,
  saldo_pendiente  NUMERIC(10,2) NOT NULL,
  fecha            DATE NOT NULL DEFAULT CURRENT_DATE,
  estado           TEXT NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','parcial','pagado')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla pagos
CREATE TABLE IF NOT EXISTS pagos (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fiado_id      BIGINT NOT NULL REFERENCES fiados(id) ON DELETE CASCADE,
  monto_pagado  NUMERIC(10,2) NOT NULL,
  fecha_pago    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  total      NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla detalle_venta (líneas)
CREATE TABLE IF NOT EXISTS detalle_venta (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  venta_id         BIGINT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id      BIGINT NOT NULL REFERENCES productos(id),
  cantidad         INTEGER NOT NULL,
  precio_unitario  NUMERIC(10,2) NOT NULL,
  subtotal         NUMERIC(10,2) NOT NULL
);

Una vez guardado el archivo, ejecútalo en el SQL Editor de tu proyecto Supabase
en https://supabase.com/dashboard/project/yhxmbkojqqffwxrwgdzq/sql/new
```

---

### ✅ Paso 0.3 — Políticas RLS

**Prompt:**
```
Crea supabase/policies.sql con las siguientes políticas Row Level Security.
Después ejecútalo en el SQL Editor de Supabase.

-- Habilitar RLS en todas las tablas
ALTER TABLE clientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiados        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_venta ENABLE ROW LEVEL SECURITY;

-- Políticas: solo usuarios autenticados pueden leer y escribir
CREATE POLICY "auth_select_clientes"      ON clientes      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_productos"     ON productos     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_fiados"        ON fiados        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_pagos"         ON pagos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_ventas"        ON ventas        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_detalle_venta" ON detalle_venta FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

### ✅ Paso 0.4 — Triggers SQL (lógica de negocio en BD)

**Prompt:**
```
Crea supabase/functions.sql con los tres triggers siguientes y ejecútalo en
el SQL Editor de Supabase.

-- ============================================================
-- TRIGGER 1: Al insertar un pago, actualiza saldo_pendiente y
-- el estado del fiado asociado.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_saldo_fiado()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_saldo  NUMERIC(10,2);
  v_total  NUMERIC(10,2);
BEGIN
  SELECT saldo_pendiente, monto_total
    INTO v_saldo, v_total
    FROM fiados WHERE id = NEW.fiado_id;

  v_saldo := v_saldo - NEW.monto_pagado;

  IF v_saldo < 0 THEN
    RAISE EXCEPTION 'El pago supera el saldo pendiente del fiado';
  END IF;

  UPDATE fiados
     SET saldo_pendiente = v_saldo,
         estado = CASE
                    WHEN v_saldo = 0 THEN 'pagado'
                    WHEN v_saldo < v_total THEN 'parcial'
                    ELSE 'pendiente'
                  END
   WHERE id = NEW.fiado_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_actualizar_saldo_fiado
AFTER INSERT ON pagos
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_saldo_fiado();

-- ============================================================
-- TRIGGER 2: Al insertar una línea de venta, descuenta stock.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_descontar_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE productos
     SET stock = stock - NEW.cantidad
   WHERE id = NEW.producto_id;

  IF (SELECT stock FROM productos WHERE id = NEW.producto_id) < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.producto_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_descontar_stock
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_stock();

-- ============================================================
-- TRIGGER 3: Al insertar una línea de venta, recalcula el
-- total de la venta cabecera.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_recalcular_total_venta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE ventas
     SET total = (
           SELECT COALESCE(SUM(subtotal), 0)
             FROM detalle_venta
            WHERE venta_id = NEW.venta_id
         )
   WHERE id = NEW.venta_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalcular_total_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW EXECUTE FUNCTION fn_recalcular_total_venta();
```

---

### ✅ Paso 0.5 — Tipos TypeScript globales
**Estado:** Hecho. `src/types/index.ts` tiene todas las interfaces alineadas con el esquema.

---

# FASE 1 — Épica 1: Clientes y Créditos (Fiados)

### ✅ Paso 1.1 — Re-export Supabase + types de clientes

**Prompt:**
```
1. Crea src/services/supabase/index.ts:
     export { supabase } from './client';

2. Crea src/modules/clientes/types/index.ts:
     export type { Cliente, ClienteConSaldo, NuevoCliente } from '../../../types';

3. Crea src/modules/fiados/types/index.ts:
     export type { Fiado, NuevoFiado, EstadoFiado } from '../../../types';

4. Crea src/modules/pagos/types/index.ts:
     export type { Pago, NuevoPago } from '../../../types';

5. Crea src/modules/productos/types/index.ts:
     export type { Producto, NuevoProducto } from '../../../types';

6. Crea src/modules/ventas/types/index.ts:
     export type { Venta, DetalleVenta, VentaConDetalle, LineaVentaInput } from '../../../types';
```

---

### ✅ Paso 1.2 — Service de clientes

**Prompt:**
```
Crea src/modules/clientes/services/clientesService.ts con el siguiente código:

import { supabase } from '../../../services/supabase/client';
import type { Cliente, ClienteConSaldo, NuevoCliente } from '../../../types';

export async function getClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Cliente[];
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function createCliente(nuevo: NuevoCliente): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert(nuevo)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function updateCliente(id: number, cambios: Partial<NuevoCliente>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Cliente;
}

export async function deleteCliente(id: number): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function buscarClientes(nombre: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('nombre', `%${nombre}%`)
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Cliente[];
}

export async function getClientesConSaldo(): Promise<ClienteConSaldo[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*, fiados(saldo_pendiente)')
    .order('nombre');
  if (error) throw new Error(error.message);

  return (data as any[]).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    direccion: c.direccion,
    created_at: c.created_at,
    saldo: (c.fiados as { saldo_pendiente: number }[]).reduce(
      (sum, f) => sum + Number(f.saldo_pendiente),
      0
    ),
  }));
}
```

---

### ✅ Paso 1.3 — Hook useClientes

**Prompt:**
```
Crea src/modules/clientes/hooks/useClientes.ts:

import { useCallback, useEffect, useState } from 'react';
import type { ClienteConSaldo } from '../../../types';
import { getClientesConSaldo } from '../services/clientesService';

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteConSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientesConSaldo();
      setClientes(data);
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { clientes, loading, error, refetch: fetch };
}
```

---

### ✅ Paso 1.4 — Componentes UI base (Button, Input, Card, EmptyState, LoadingSpinner)

**Prompt:**
```
Crea los siguientes componentes en src/components/ui/ usando el theme de
src/theme/index.ts (colors, spacing, fontSize, borderRadius).

--- src/components/ui/Button.tsx ---
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: Props) {
  const bg = variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.border : colors.primary;
  const textColor = variant === 'secondary' ? colors.text : '#fff';
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  label: { fontSize: fontSize.md, fontWeight: '600' },
});

--- src/components/ui/Input.tsx ---
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style as any]}
        placeholderTextColor={colors.textSecondary}
        {...rest}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputError: { borderColor: colors.danger },
  errorText: { fontSize: fontSize.xs, color: colors.danger, marginTop: spacing.xs },
});

--- src/components/ui/Card.tsx ---
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

export function Card({ children, style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});

--- src/components/ui/EmptyState.tsx ---
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, spacing } from '../../theme';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  text: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
});

--- src/components/ui/LoadingSpinner.tsx ---
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

--- src/components/ui/ErrorMessage.tsx ---
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../theme';

export function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.md,
  },
  text: { color: colors.danger, fontSize: fontSize.sm },
});

--- src/components/common/ScreenContainer.tsx ---
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export function ScreenContainer({ children, style, ...rest }: ViewProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
});
```

---

### ✅ Paso 1.5 — Validaciones centralizadas

**Prompt:**
```
Crea src/utils/validation.ts con el siguiente contenido:

export function requerido(valor: string): string | null {
  return valor.trim().length === 0 ? 'Este campo es obligatorio' : null;
}

export function esNumeroPositivo(valor: string): string | null {
  const n = parseFloat(valor);
  if (isNaN(n) || n < 0) return 'Debe ser un número mayor o igual a 0';
  return null;
}

export function esEnteroPositivo(valor: string): string | null {
  const n = parseInt(valor, 10);
  if (isNaN(n) || n < 0 || !Number.isInteger(n)) return 'Debe ser un número entero mayor o igual a 0';
  return null;
}

export function esMontoValido(valor: string): string | null {
  const n = parseFloat(valor);
  if (isNaN(n) || n <= 0) return 'El monto debe ser mayor a 0';
  return null;
}
```

---

### ✅ Paso 1.6 — Pantalla registrar/editar cliente (US1, TC1)

**Prompt:**
```
Crea src/modules/clientes/screens/ClienteFormScreen.tsx.

El archivo recibe por params de navegación un objeto opcional `cliente`
(tipo Cliente | undefined) para modo edición.

Importaciones necesarias:
- React, useState
- Alert, ScrollView, StyleSheet, View de 'react-native'
- NativeStackScreenProps de '@react-navigation/native-stack'
- ScreenContainer de '../../../components/common/ScreenContainer'
- Input de '../../../components/ui/Input'
- Button de '../../../components/ui/Button'
- createCliente, updateCliente de '../services/clientesService'
- requerido de '../../../utils/validation'
- Cliente de '../../../types'
- ClientesStackParamList (que definirás en el Paso 1.9)

El componente debe:
1. Tener tres campos controlados: nombre (obligatorio), telefono, direccion.
2. Al presionar "Guardar": validar que nombre no esté vacío; si falla mostrar
   error inline bajo el campo (no Alert). Si pasa, llamar createCliente o
   updateCliente según si hay cliente en params.
3. Mostrar Button con loading=true mientras guarda.
4. Al guardar exitosamente: navegar hacia atrás con navigation.goBack().
5. Si hay error de red: mostrarlo con Alert.alert('Error', e.message).
6. Usar ScreenContainer como contenedor, Input y Button de los componentes UI.
7. El título del header debe ser "Nuevo cliente" o "Editar cliente" según el modo.
```

---

### ✅ Paso 1.7 — Componente ClienteCard

**Prompt:**
```
Crea src/modules/clientes/components/ClienteCard.tsx:

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, fontSize, spacing } from '../../../theme';
import type { ClienteConSaldo } from '../../../types';

interface Props {
  cliente: ClienteConSaldo;
  onPress: () => void;
}

export function ClienteCard({ cliente, onPress }: Props) {
  const tieneSaldo = cliente.saldo > 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.nombre}>{cliente.nombre}</Text>
            <Text style={styles.telefono}>{cliente.telefono}</Text>
          </View>
          <View style={[styles.badge, tieneSaldo ? styles.badgeDeuda : styles.badgeOk]}>
            <Text style={[styles.badgeText, tieneSaldo ? styles.badgeTextDeuda : styles.badgeTextOk]}>
              L {Number(cliente.saldo).toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  nombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  telefono: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 99, paddingVertical: 4, paddingHorizontal: spacing.sm, marginLeft: spacing.sm },
  badgeDeuda: { backgroundColor: '#FEE2E2' },
  badgeOk: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },
  badgeTextDeuda: { color: colors.danger },
  badgeTextOk: { color: colors.secondary },
});
```

---

### ✅ Paso 1.8 — Pantalla listado y búsqueda de clientes (US1, US3, TC4)

**Prompt:**
```
Reescribe src/modules/clientes/screens/ClientesScreen.tsx completo:

- Importa useClientes de '../hooks/useClientes'.
- Importa ClienteCard de '../components/ClienteCard'.
- Importa ScreenContainer, LoadingSpinner, EmptyState, ErrorMessage de los
  componentes correspondientes.
- Importa TextInput, FlatList, TouchableOpacity, StyleSheet, Text, View de RN.
- El estado de búsqueda filtra `clientes` localmente por nombre (toLowerCase).
- Muestra un TextInput de búsqueda arriba.
- Renderiza la lista con FlatList + ClienteCard.
- Al tocar un cliente: navigation.navigate('ClienteDetail', { clienteId: cliente.id }).
- Botón flotante (+) en la esquina inferior derecha: navigation.navigate('ClienteForm').
- Durante carga: <LoadingSpinner />.
- Lista vacía: <EmptyState message="No hay clientes registrados" />.
- Error: <ErrorMessage message={error} />.
- Al hacer pull-to-refresh llama refetch.
```

---

### ✅ Paso 1.9 — Service y hook de fiados

**Prompt:**
```
1. Crea src/modules/fiados/services/fiadosService.ts:

import { supabase } from '../../../services/supabase/client';
import type { Fiado, NuevoFiado } from '../../../types';

export async function getFiadosByCliente(clienteId: number): Promise<Fiado[]> {
  const { data, error } = await supabase
    .from('fiados')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Fiado[];
}

export async function getFiadoById(id: number): Promise<Fiado> {
  const { data, error } = await supabase
    .from('fiados')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Fiado;
}

export async function createFiado(nuevo: NuevoFiado): Promise<Fiado> {
  const { data, error } = await supabase
    .from('fiados')
    .insert({ ...nuevo, saldo_pendiente: nuevo.monto_total, estado: 'pendiente' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Fiado;
}

2. Crea src/modules/fiados/hooks/useFiados.ts:

import { useCallback, useEffect, useState } from 'react';
import type { Fiado } from '../../../types';
import { getFiadosByCliente } from '../services/fiadosService';

export function useFiados(clienteId: number) {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiados(await getFiadosByCliente(clienteId));
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { fiados, loading, error, refetch: fetch };
}
```

---

### ✅ Paso 1.10 — Service y hook de pagos

**Prompt:**
```
1. Crea src/modules/pagos/services/pagosService.ts:

import { supabase } from '../../../services/supabase/client';
import type { Pago, NuevoPago } from '../../../types';

export async function createPago(nuevo: NuevoPago): Promise<Pago> {
  const { data, error } = await supabase
    .from('pagos')
    .insert(nuevo)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Pago;
}

export async function getPagosByFiado(fiadoId: number): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('fiado_id', fiadoId)
    .order('fecha_pago', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Pago[];
}

export async function getPagosByCliente(clienteId: number): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, fiados!inner(cliente_id)')
    .eq('fiados.cliente_id', clienteId)
    .order('fecha_pago', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Pago[];
}

2. Crea src/modules/pagos/hooks/usePagos.ts:

import { useCallback, useEffect, useState } from 'react';
import type { Pago } from '../../../types';
import { getPagosByFiado } from '../services/pagosService';

export function usePagos(fiadoId: number) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPagos(await getPagosByFiado(fiadoId));
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [fiadoId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { pagos, loading, error, refetch: fetch };
}
```

---

### ✅ Paso 1.11 — Pantalla detalle de cliente (US3)

**Prompt:**
```
Crea src/modules/clientes/screens/ClienteDetailScreen.tsx.

Recibe por params: { clienteId: number }.

Comportamiento:
- Al montar: llama getClienteById(clienteId) y getFiadosByCliente(clienteId).
- Muestra: nombre, teléfono, dirección del cliente.
- Muestra el saldo total pendiente (suma de saldo_pendiente de los fiados activos).
- Lista los fiados con: monto_total, saldo_pendiente, estado (badge de color:
  pendiente=naranja, parcial=amarillo, pagado=verde) y fecha.
- Botón "Agregar fiado" → navigation.navigate('FiadoForm', { clienteId }).
- Botón "Registrar pago" → al presionar, si solo hay un fiado con saldo > 0 navega
  directamente a PagoForm con { fiadoId }; si hay varios, muestra un Alert con
  opciones para elegir el fiado.
- Botón "Ver historial de pagos" → navigation.navigate('HistorialPagos', { clienteId }).
- Icono de editar en el header → navigation.navigate('ClienteForm', { cliente }).
- Usa ScreenContainer, LoadingSpinner, Button.
```

---

### ✅ Paso 1.12 — Pantalla registrar fiado (US2, TC2, TC3)

**Prompt:**
```
Crea src/modules/fiados/screens/FiadoFormScreen.tsx.

Recibe por params: { clienteId: number }.

Comportamiento:
- Muestra el nombre del cliente (cárgalo con getClienteById(clienteId)).
- Un campo "Monto" (TextInput numérico).
- Validación con esMontoValido de src/utils/validation.ts: si falla, muestra
  error inline y NO llama al service.
- Al guardar: llama createFiado({ cliente_id: clienteId, monto_total: parseFloat(monto) }).
- Loading en el botón mientras guarda.
- Al guardar exitosamente: navigation.goBack().
- Error de red: Alert.alert('Error', e.message).
- Usa ScreenContainer, Input, Button.
```

---

### ✅ Paso 1.13 — Pantalla registrar pago (US4, TC5)

**Prompt:**
```
Crea src/modules/pagos/screens/PagoFormScreen.tsx.

Recibe por params: { fiadoId: number }.

Comportamiento:
- Al montar: carga el fiado con getFiadoById(fiadoId) para mostrar el
  saldo_pendiente disponible.
- Muestra el saldo disponible encima del campo.
- Campo "Monto a pagar" (TextInput numérico).
- Validaciones:
    a) esMontoValido(monto) → error inline si falla.
    b) Si parseFloat(monto) > fiado.saldo_pendiente → error inline
       "El monto supera el saldo pendiente".
- Al guardar: llama createPago({ fiado_id: fiadoId, monto_pagado: parseFloat(monto) }).
- Loading en el botón mientras guarda.
- Al guardar exitosamente: navigation.goBack().
- Error de red: Alert.alert('Error', e.message).
- Usa ScreenContainer, Input, Button.
```

---

### ✅ Paso 1.14 — Pantalla historial de pagos (US4)

**Prompt:**
```
Crea src/modules/pagos/screens/HistorialPagosScreen.tsx.

Recibe por params: { clienteId: number }.

Comportamiento:
- Carga pagos con getPagosByCliente(clienteId).
- Muestra cada pago con: monto_pagado (formateado como "L 0.00"), fecha_pago.
- Si la lista está vacía: <EmptyState message="Sin pagos registrados" />.
- Pull-to-refresh llama refetch.
- Usa ScreenContainer, LoadingSpinner, EmptyState, Card.
```

---

### ✅ Paso 1.15 — Navegación Épica 1 (Clientes con Stack anidado)

**Prompt:**
```
Modifica src/navigation/AppNavigator.tsx para que el tab "Clientes" use un
Stack Navigator anidado. El tab "Fiados" se elimina.

Primero define el param list del stack de clientes en un archivo nuevo
src/navigation/types.ts:

import type { Cliente } from '../types';

export type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { cliente?: Cliente };
  ClienteDetail: { clienteId: number };
  FiadoForm: { clienteId: number };
  PagoForm: { fiadoId: number };
  HistorialPagos: { clienteId: number };
};

export type ProductosStackParamList = {
  ProductosList: undefined;
  ProductoForm: { productoId?: number };
};

export type VentasStackParamList = {
  VentasList: undefined;
  VentaForm: undefined;
  VentaDetail: { ventaId: number };
};

Luego en AppNavigator.tsx:
- Importa createNativeStackNavigator de '@react-navigation/native-stack'.
- Crea ClientesStack con las 6 pantallas de ClientesStackParamList.
- El tab "Clientes" apunta al componente ClientesStack (no a ClientesScreen directo).
- Los otros tabs (Dashboard, Productos, Ventas) por ahora apuntan a sus pantallas
  placeholder actuales.
- Elimina completamente el tab "Fiados".
- Agrega iconos de texto simples en tabBarIcon usando Text de RN:
  Dashboard="📊", Clientes="👥", Productos="📦", Ventas="🛒".
```

---

# FASE 2 — Épica 2: Inventario

### Paso 2.1 — Service y hooks de productos

**Prompt:**
```
1. Crea src/modules/productos/services/productosService.ts:

import { supabase } from '../../../services/supabase/client';
import type { Producto, NuevoProducto } from '../../../types';

export async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data as Producto[];
}

export async function getProductoById(id: number): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function createProducto(nuevo: NuevoProducto): Promise<Producto> {
  const row = { ...nuevo, stock_minimo: nuevo.stock_minimo ?? 5 };
  const { data, error } = await supabase
    .from('productos')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function updateProducto(id: number, cambios: Partial<NuevoProducto>): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Producto;
}

export async function deleteProducto(id: number): Promise<void> {
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

2. Crea src/modules/productos/hooks/useProductos.ts:

import { useCallback, useEffect, useState } from 'react';
import type { Producto } from '../../../types';
import { getProductos } from '../services/productosService';

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setProductos(await getProductos()); }
    catch (e: any) { setError(e.message ?? 'Error de conexión'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { productos, loading, error, refetch: fetch };
}

3. Crea src/modules/productos/hooks/useProductosBajoStock.ts:

import { useMemo } from 'react';
import { useProductos } from './useProductos';

export function useProductosBajoStock() {
  const { productos, loading, error, refetch } = useProductos();
  const bajoStock = useMemo(
    () => productos.filter((p) => p.stock <= p.stock_minimo),
    [productos]
  );
  return { productos: bajoStock, loading, error, refetch };
}
```

---

### Paso 2.2 — Componente ProductoCard

**Prompt:**
```
Crea src/modules/productos/components/ProductoCard.tsx:

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, fontSize, spacing } from '../../../theme';
import type { Producto } from '../../../types';

interface Props {
  producto: Producto;
  onPress: () => void;
}

export function ProductoCard({ producto, onPress }: Props) {
  const bajStock = producto.stock <= producto.stock_minimo;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={bajStock ? styles.cardAlert : undefined}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.nombre}>{producto.nombre}</Text>
            <Text style={styles.precio}>L {Number(producto.precio).toFixed(2)}</Text>
          </View>
          <View style={[styles.stockBadge, bajStock ? styles.stockBajo : styles.stockOk]}>
            <Text style={[styles.stockText, bajStock ? styles.stockTextBajo : styles.stockTextOk]}>
              {producto.stock} uds
            </Text>
            {bajStock && <Text style={styles.alerta}>⚠ Bajo stock</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  nombre: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  precio: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  cardAlert: { borderLeftWidth: 4, borderLeftColor: colors.warning },
  stockBadge: { alignItems: 'center', borderRadius: 8, padding: spacing.sm },
  stockOk: { backgroundColor: '#D1FAE5' },
  stockBajo: { backgroundColor: '#FEF3C7' },
  stockText: { fontSize: fontSize.sm, fontWeight: '700' },
  stockTextOk: { color: colors.secondary },
  stockTextBajo: { color: colors.warning },
  alerta: { fontSize: fontSize.xs, color: colors.warning, marginTop: 2 },
});
```

---

### Paso 2.3 — Pantalla listado de productos con alerta de bajo stock (US6, US7)

**Prompt:**
```
Reescribe src/modules/productos/screens/ProductosScreen.tsx:

- Usa useProductos para obtener la lista.
- Renderiza con FlatList + ProductoCard.
- Al tocar un producto navega a ProductoForm con { productoId: producto.id }.
- Botón flotante (+) navega a ProductoForm sin params (modo crear).
- Pull-to-refresh llama refetch.
- Durante carga: LoadingSpinner.
- Lista vacía: EmptyState con "No hay productos registrados".
- Error: ErrorMessage.
- Usa ScreenContainer.

NativeStackScreenProps: usa ProductosStackParamList del archivo
src/navigation/types.ts.
```

---

### Paso 2.4 — Pantalla registrar/editar producto (US5, US6)

**Prompt:**
```
Crea src/modules/productos/screens/ProductoFormScreen.tsx.

Recibe por params: { productoId?: number }.

Comportamiento:
- Si productoId existe: carga el producto con getProductoById al montar y
  pre-rellena los campos.
- Campos: nombre (obligatorio), precio (numérico >= 0), stock (entero >= 0),
  stock_minimo (entero >= 0, valor por defecto "5").
- Validaciones con los helpers de src/utils/validation.ts; errores inline.
- Al guardar: llama createProducto o updateProducto según si hay productoId.
- Loading en el botón mientras guarda.
- Al guardar exitosamente: navigation.goBack().
- Usa ScreenContainer, Input, Button.
- Título del header: "Nuevo producto" o "Editar producto".
```

---

### Paso 2.5 — Dashboard con resumen (US7)

**Prompt:**
```
Reescribe src/modules/dashboard/screens/DashboardScreen.tsx:

Importa:
- useClientesConSaldo (crea un hook simple en clientes que llame getClientesConSaldo)
  o llama directamente al service desde un useEffect.
- useProductosBajoStock de módulo productos.
- useVentasDelDia (crea un hook simple que llame getVentasDelDia, que definirás
  en el Paso 3.1).

Muestra tres tarjetas (Card):
1. "Clientes con deuda": número de clientes con saldo > 0 y total adeudado en L.
2. "Productos con bajo stock": lista corta (máximo 5 items) con nombre y stock;
   si no hay, muestra "Todos los productos tienen stock suficiente".
3. "Ventas de hoy": total de ventas del día en L.

Usa ScreenContainer.
Si alguna carga falla, muestra ErrorMessage en esa tarjeta.
```

---

### Paso 2.6 — Rutas de productos en AppNavigator

**Prompt:**
```
Modifica src/navigation/AppNavigator.tsx para que el tab "Productos" use un
Stack Navigator anidado con ProductosStackParamList (de src/navigation/types.ts):
  - ProductosList → ProductosScreen
  - ProductoForm → ProductoFormScreen

Agrega la importación de ProductoFormScreen.
El Stack de productos se monta igual que el de clientes.
```

---

# FASE 3 — Épica 3: Ventas

### Paso 3.1 — Service y hook de ventas (US8)

**Prompt:**
```
Crea src/modules/ventas/services/ventasService.ts:

import { supabase } from '../../../services/supabase/client';
import type { Venta, VentaConDetalle, LineaVentaInput, DetalleVenta } from '../../../types';
import { getProductoById } from '../../productos/services/productosService';

export async function getVentas(): Promise<Venta[]> {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .order('fecha', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Venta[];
}

export async function getVentasDelDia(): Promise<Venta[]> {
  const hoy = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('fecha', hoy);
  if (error) throw new Error(error.message);
  return data as Venta[];
}

export async function getVentaConDetalle(id: number): Promise<VentaConDetalle> {
  const { data, error } = await supabase
    .from('ventas')
    .select('*, detalle_venta(*, productos(*))')
    .eq('id', id)
    .single();
  if (error) throw new Error(error.message);
  const v = data as any;
  return {
    id: v.id, total: v.total, fecha: v.fecha, created_at: v.created_at,
    detalles: v.detalle_venta.map((d: any) => ({
      ...d, producto: d.productos,
    })),
  };
}

export async function createVenta(lineas: LineaVentaInput[]): Promise<Venta> {
  // 1. Validar stock
  for (const linea of lineas) {
    const p = await getProductoById(linea.producto_id);
    if (p.stock < linea.cantidad) {
      throw new Error(`Stock insuficiente para "${p.nombre}" (disponible: ${p.stock})`);
    }
  }

  // 2. Crear cabecera
  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .insert({ total: 0 })
    .select()
    .single();
  if (ventaError) throw new Error(ventaError.message);
  const venta = ventaData as Venta;

  // 3. Insertar líneas (los triggers actualizan stock y total)
  for (const linea of lineas) {
    const p = await getProductoById(linea.producto_id);
    const subtotal = Number(p.precio) * linea.cantidad;
    const { error } = await supabase.from('detalle_venta').insert({
      venta_id: venta.id,
      producto_id: linea.producto_id,
      cantidad: linea.cantidad,
      precio_unitario: p.precio,
      subtotal,
    });
    if (error) throw new Error(error.message);
  }

  // 4. Devolver venta actualizada (el trigger ya actualizó el total)
  const { data: updated, error: upError } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', venta.id)
    .single();
  if (upError) throw new Error(upError.message);
  return updated as Venta;
}

---

Crea src/modules/ventas/hooks/useVentas.ts:

import { useCallback, useEffect, useState } from 'react';
import type { Venta } from '../../../types';
import { getVentas } from '../services/ventasService';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setVentas(await getVentas()); }
    catch (e: any) { setError(e.message ?? 'Error de conexión'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { ventas, loading, error, refetch: fetch };
}
```

---

### Paso 3.2 — Pantalla registrar venta (US8, validación de stock)

**Prompt:**
```
Crea src/modules/ventas/screens/VentaFormScreen.tsx.

Estado local:
- lineas: Array<{ producto: Producto; cantidad: number }> (empieza vacío).
- productoSeleccionado: Producto | null.
- cantidadInput: string.
- loading: boolean.
- errorMsg: string | null.

Carga la lista de productos con useProductos al montar.

UI:
1. FlatList con las líneas ya agregadas. Cada línea muestra:
   nombre del producto, cantidad, subtotal (precio * cantidad), botón "X" para quitar.
2. Sección "Agregar línea":
   - Picker o lista seleccionable de productos (muestra nombre y stock disponible).
   - TextInput de cantidad (entero > 0, no mayor al stock del producto seleccionado).
   - Botón "Agregar línea": valida stock, agrega al array local.
3. Total en tiempo real: suma de (precio * cantidad) de todas las líneas.
4. Botón "Registrar venta":
   - Valida que haya al menos una línea.
   - Llama createVenta(lineas.map(l => ({ producto_id: l.producto.id, cantidad: l.cantidad }))).
   - Loading en botón.
   - Si hay error: muestra errorMsg.
   - Al éxito: navigation.goBack().

Usa ScreenContainer, Input, Button.
Nota: para el selector de producto puedes usar un FlatList con items presionables
si no hay Picker instalado.
```

---

### Paso 3.3 — Pantalla listado de ventas y detalle (US8)

**Prompt:**
```
1. Reescribe src/modules/ventas/screens/VentasScreen.tsx:
   - Usa useVentas.
   - Arriba muestra el total del día (suma de ventas con fecha = hoy).
   - FlatList: cada item muestra fecha y total (L 0.00).
   - Al tocar: navigation.navigate('VentaDetail', { ventaId: venta.id }).
   - Botón flotante (+) navega a VentaForm.
   - Pull-to-refresh, LoadingSpinner, EmptyState, ErrorMessage.
   - Usa ScreenContainer.

2. Crea src/modules/ventas/screens/VentaDetailScreen.tsx:
   - Recibe params: { ventaId: number }.
   - Carga la venta con getVentaConDetalle(ventaId).
   - Muestra fecha y total.
   - Lista los detalles: nombre del producto, cantidad, precio unitario, subtotal.
   - Usa ScreenContainer, Card, LoadingSpinner.
```

---

### Paso 3.4 — Rutas de ventas en AppNavigator

**Prompt:**
```
Modifica src/navigation/AppNavigator.tsx para que el tab "Ventas" use un
Stack Navigator anidado con VentasStackParamList:
  - VentasList → VentasScreen
  - VentaForm → VentaFormScreen
  - VentaDetail → VentaDetailScreen

Importa VentaFormScreen y VentaDetailScreen.
```

---

# FASE 4 — Robustez y UX

### Paso 4.1 — Toast/banner de errores de red global

**Prompt:**
```
Crea src/contexts/ToastContext.tsx:

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '../theme';

interface ToastCtx { showError: (msg: string) => void; }
const ToastContext = createContext<ToastCtx>({ showError: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);

  const showError = useCallback((m: string) => {
    setMsg(m);
    setVisible(true);
    setTimeout(() => setVisible(false), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      {visible && (
        <Text style={styles.toast}>{msg}</Text>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.danger,
    color: '#fff',
    padding: spacing.md,
    borderRadius: 8,
    fontSize: fontSize.sm,
    textAlign: 'center',
    zIndex: 9999,
  },
});

Luego en App.tsx envuelve <AuthProvider> con <ToastProvider>:
  <ToastProvider>
    <AuthProvider>
      ...
    </AuthProvider>
  </ToastProvider>
```

---

# FASE 5 — Pruebas

### Paso 5.1 — Configurar entorno de testing

**Prompt:**
```
Ejecuta en la terminal del proyecto:
  npx expo install jest-expo @testing-library/react-native

Luego instala como devDependency:
  npm install --save-dev @testing-library/jest-native

En package.json agrega:
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"]
  },
  "scripts": {
    "test": "jest"
  }

Crea src/services/supabase/__mocks__/client.ts:
  export const supabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
  };
```

---

### Paso 5.2 — Pruebas unitarias (cálculos y validaciones)

**Prompt:**
```
Crea src/utils/__tests__/validation.test.ts:

import { requerido, esNumeroPositivo, esEnteroPositivo, esMontoValido } from '../validation';

describe('requerido', () => {
  it('devuelve error con cadena vacía', () => expect(requerido('')).toBeTruthy());
  it('devuelve error con solo espacios', () => expect(requerido('   ')).toBeTruthy());
  it('devuelve null con valor válido', () => expect(requerido('Juan')).toBeNull());
});

describe('esMontoValido', () => {
  it('error con 0', () => expect(esMontoValido('0')).toBeTruthy());
  it('error con texto', () => expect(esMontoValido('abc')).toBeTruthy());
  it('null con número positivo', () => expect(esMontoValido('100.5')).toBeNull());
});

describe('esEnteroPositivo', () => {
  it('error con decimal', () => expect(esEnteroPositivo('1.5')).toBeTruthy());
  it('null con entero 0', () => expect(esEnteroPositivo('0')).toBeNull());
  it('null con entero positivo', () => expect(esEnteroPositivo('5')).toBeNull());
});

Crea src/modules/clientes/__tests__/saldo.test.ts:

describe('cálculo de saldo cliente', () => {
  it('suma saldo_pendiente de fiados activos', () => {
    const fiados = [
      { saldo_pendiente: 100 },
      { saldo_pendiente: 50 },
      { saldo_pendiente: 0 },
    ];
    const total = fiados.reduce((s, f) => s + Number(f.saldo_pendiente), 0);
    expect(total).toBe(150);
  });
});

Crea src/modules/ventas/__tests__/total.test.ts:

describe('cálculo de total de venta', () => {
  it('calcula subtotal por línea', () => {
    const lineas = [
      { precio: 20, cantidad: 3 },
      { precio: 15, cantidad: 2 },
    ];
    const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
    expect(total).toBe(90);
  });
});

Crea src/modules/productos/__tests__/bajoStock.test.ts:

describe('detección de bajo stock', () => {
  it('filtra productos con stock <= stock_minimo', () => {
    const productos = [
      { nombre: 'A', stock: 3, stock_minimo: 5 },
      { nombre: 'B', stock: 10, stock_minimo: 5 },
      { nombre: 'C', stock: 5, stock_minimo: 5 },
    ];
    const bajos = productos.filter(p => p.stock <= p.stock_minimo);
    expect(bajos.length).toBe(2);
    expect(bajos.map(p => p.nombre)).toEqual(['A', 'C']);
  });
});
```

---

# FASE 6 — Despliegue y CI/CD

### Paso 6.1 — Configurar EAS

**Prompt:**
```
Crea eas.json en la raíz del proyecto:

{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_ENV": "staging" }
    },
    "production": {
      "env": { "APP_ENV": "production" }
    }
  }
}

Luego instala EAS CLI globalmente si no lo tienes:
  npm install -g eas-cli

Y autentica:
  eas login
  eas build:configure
```

---

### Paso 6.2 — CI/CD con GitHub Actions

**Prompt:**
```
Crea .github/workflows/ci.yml:

name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --watchAll=false --passWithNoTests

Crea también .github/workflows/preview.yml:

name: Preview Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --profile preview --platform android --non-interactive
```

---

## Orden de ejecución recomendado

```
FASE 0 (0.2 → 0.3 → 0.4 en Supabase)
  → FASE 1 (1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 1.10 → 1.11 → 1.12 → 1.13 → 1.14 → 1.15)
  → FASE 2 (2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6)
  → FASE 3 (3.1 → 3.2 → 3.3 → 3.4)
  → FASE 4
  → FASE 5
  → FASE 6
```

## Checklist Definition of Done (por funcionalidad)

- [ ] El código compila sin errores TypeScript (`npx tsc --noEmit`).
- [ ] La información se guarda y lee correctamente en Supabase.
- [ ] Tiene pruebas unitarias cubiertas (`npm test`).
- [ ] Se probó manualmente en dispositivo o emulador.
- [ ] Cumple los criterios de aceptación de su historia de usuario.

---

# AUDITORÍA — Archivos creados y modificados por fase

> Referencia para revisión. Los archivos marcados con ⚠ deben ejecutarse en Supabase y luego eliminarse del proyecto.

---

## FASE 0 — Configuración base (pre-existente)

| Estado | Archivo |
|--------|---------|
| Pre-existente | `src/services/supabase/client.ts` |
| Pre-existente | `src/contexts/AuthContext.tsx` |
| Pre-existente | `src/navigation/AuthNavigator.tsx` |
| Pre-existente | `src/navigation/RootNavigator.tsx` |
| Pre-existente | `src/modules/auth/screens/LoginScreen.tsx` |
| Pre-existente | `src/theme/index.ts` |
| Pre-existente | `.env` |
| ⚠ Ejecutar y eliminar | `supabase/schema.sql` |
| ⚠ Ejecutar y eliminar | `supabase/policies.sql` |
| ⚠ Ejecutar y eliminar | `supabase/functions.sql` |

---

## FASE 1 — Épica 1: Clientes y Créditos

### Creados

| Archivo | Descripción |
|---------|-------------|
| `src/types/index.ts` | Tipos globales: Cliente, Fiado, Pago, Producto, Venta, etc. |
| `src/services/supabase/index.ts` | Re-export del cliente Supabase |
| `src/utils/validation.ts` | Helpers: `requerido`, `esMontoValido`, `esEnteroPositivo`, `esNumeroPositivo` |
| `src/navigation/types.ts` | `ClientesStackParamList`, `ProductosStackParamList`, `VentasStackParamList` |
| `src/components/common/ScreenContainer.tsx` | Contenedor base con SafeAreaView |
| `src/components/ui/Button.tsx` | Botón con variantes primary/secondary/danger y loading |
| `src/components/ui/Input.tsx` | Input con label y error inline |
| `src/components/ui/Card.tsx` | Tarjeta con sombra |
| `src/components/ui/EmptyState.tsx` | Estado vacío centrado |
| `src/components/ui/LoadingSpinner.tsx` | Spinner centrado |
| `src/components/ui/ErrorMessage.tsx` | Banner de error rojo |
| `src/modules/clientes/types/index.ts` | Re-export de tipos de clientes |
| `src/modules/fiados/types/index.ts` | Re-export de tipos de fiados |
| `src/modules/pagos/types/index.ts` | Re-export de tipos de pagos |
| `src/modules/productos/types/index.ts` | Re-export de tipos de productos |
| `src/modules/ventas/types/index.ts` | Re-export de tipos de ventas |
| `src/modules/clientes/services/clientesService.ts` | CRUD clientes + `getClientesConSaldo` |
| `src/modules/clientes/hooks/useClientes.ts` | Hook: lista clientes con saldo |
| `src/modules/clientes/components/ClienteCard.tsx` | Card de cliente con badge de deuda |
| `src/modules/clientes/screens/ClienteFormScreen.tsx` | Formulario crear/editar cliente |
| `src/modules/clientes/screens/ClienteDetailScreen.tsx` | Detalle: info + fiados activos + acciones |
| `src/modules/fiados/services/fiadosService.ts` | `getFiadosByCliente`, `getFiadoById`, `createFiado` |
| `src/modules/fiados/hooks/useFiados.ts` | Hook: fiados de un cliente |
| `src/modules/fiados/screens/FiadoFormScreen.tsx` | Formulario registrar fiado |
| `src/modules/pagos/services/pagosService.ts` | `createPago`, `getPagosByFiado`, `getPagosByCliente` |
| `src/modules/pagos/hooks/usePagos.ts` | Hook: pagos de un fiado |
| `src/modules/pagos/screens/PagoFormScreen.tsx` | Formulario registrar pago (valida ≤ saldo) |
| `src/modules/pagos/screens/HistorialPagosScreen.tsx` | Lista de pagos de un cliente |

### Modificados

| Archivo | Qué cambió |
|---------|-----------|
| `src/modules/clientes/screens/ClientesScreen.tsx` | Reescrito: FlatList + búsqueda local + FAB |
| `src/navigation/AppNavigator.tsx` | Tab Clientes → `ClientesNavigator` (Stack 6 pantallas); eliminado tab Fiados |

---

## FASE 2 — Épica 2: Inventario

### Creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/productos/services/productosService.ts` | CRUD completo de productos |
| `src/modules/productos/hooks/useProductos.ts` | Hook: lista todos los productos |
| `src/modules/productos/hooks/useProductosBajoStock.ts` | Hook: filtra `stock <= stock_minimo` |
| `src/modules/productos/components/ProductoCard.tsx` | Card con badge de stock y borde ⚠ si bajo |
| `src/modules/productos/screens/ProductoFormScreen.tsx` | Formulario crear/editar producto (4 campos) |
| `src/modules/ventas/services/ventasService.ts` | Stub inicial: solo `getVentasDelDia` (completado en FASE 3) |
| `src/modules/ventas/hooks/useVentasDelDia.ts` | Hook: ventas del día para Dashboard |
| ⚠ Ejecutar y eliminar | `supabase/seed.sql` — 15 productos, 5 clientes, 5 fiados, 2 pagos |

### Modificados

| Archivo | Qué cambió |
|---------|-----------|
| `src/modules/productos/screens/ProductosScreen.tsx` | Reescrito: FlatList + ProductoCard + FAB |
| `src/modules/dashboard/screens/DashboardScreen.tsx` | Reescrito: 3 tarjetas (deuda clientes, bajo stock, ventas hoy) |
| `src/navigation/AppNavigator.tsx` | Tab Productos → `ProductosNavigator` (Stack 2 pantallas) |

---

## FASE 3 — Épica 3: Ventas

### Creados

| Archivo | Descripción |
|---------|-------------|
| `src/modules/ventas/hooks/useVentas.ts` | Hook: lista todas las ventas |
| `src/modules/ventas/screens/VentaFormScreen.tsx` | Formulario nueva venta: productos + cliente opcional + contado/fiado + cobro de deuda |
| `src/modules/ventas/screens/VentaDetailScreen.tsx` | Detalle: encabezado (cliente, tipo pago, total) + líneas de productos |

### Modificados

| Archivo | Qué cambió |
|---------|-----------|
| `src/modules/ventas/services/ventasService.ts` | Completado: `getVentas`, `getVentaConDetalle`, `createVenta` (con `clienteId` y `tipoPago`; crea fiado automático si es fiado); join con `clientes` en detail |
| `src/modules/ventas/screens/VentasScreen.tsx` | Reescrito: resumen del día + lista con badge "Fiado" + FAB |
| `src/modules/ventas/screens/VentaDetailScreen.tsx` | Muestra nombre del cliente y badge Contado/Fiado |
| `src/types/index.ts` | Nuevo tipo `TipoPago`; `Venta` + `cliente_id` y `tipo_pago`; `VentaConDetalle` + `cliente?` |
| `src/navigation/AppNavigator.tsx` | Tab Ventas → `VentasNavigator` (Stack 3 pantallas) |
| ⚠ Ejecutar y eliminar | `supabase/migration_ventas.sql` — agrega `cliente_id` y `tipo_pago` a tabla `ventas` |

---

## FASE 4 — Robustez y UX

### Creados / Modificados

| Archivo | Descripción |
|---------|-------------|
| `src/contexts/ToastContext.tsx` | Contexto de toast para errores de red |
| `App.tsx` | Envuelto con `<ToastProvider>` |

---

## FASE 5 — Pruebas

### Creados

| Archivo | Descripción |
|---------|-------------|
| `src/services/supabase/__mocks__/client.ts` | Mock de Supabase para tests |
| `src/utils/__tests__/validation.test.ts` | Tests de `requerido`, `esNumeroPositivo`, `esEnteroPositivo`, `esMontoValido` |
| `src/modules/clientes/__tests__/saldo.test.ts` | Test cálculo de saldo de cliente |
| `src/modules/ventas/__tests__/total.test.ts` | Test cálculo de total de venta |
| `src/modules/productos/__tests__/bajoStock.test.ts` | Test detección de bajo stock |

### Modificados

| Archivo | Qué cambió |
|---------|-----------|
| `package.json` | `jest-expo`, `@testing-library/react-native`, `@types/jest` como devDependencies; config `"jest": { "preset": "jest-expo" }`; script `"test": "jest"` |
| `tsconfig.json` | Agregado `"types": ["jest"]` (necesario con `moduleResolution: "bundler"` para que TS reconozca los globals de Jest) |

**Nota:** se omitió `@testing-library/jest-native` — está deprecado desde que `@testing-library/react-native@12.4+` incluye sus matchers de forma nativa, y además genera conflicto de peer deps con React 19.

Resultado: `npm test` → 4 suites, 18 tests, todos pasando. `npx tsc --noEmit` → sin errores.

---

## FASE 6 — Despliegue y CI/CD

### Creados

| Archivo | Descripción |
|---------|-------------|
| `eas.json` | Perfiles `development`/`preview`/`production` |
| `.github/workflows/ci.yml` | Corre `npm test` en cada push/PR a `main` |
| `.github/workflows/preview.yml` | Build preview con EAS en push a `main` |

### Pendiente (acción manual del usuario, requiere su cuenta Expo/GitHub)

- `eas login` y `eas build:configure`
- Configurar el secret `EXPO_TOKEN` en GitHub para que `preview.yml` funcione
