# Sección 11: Acceso Demo y Recorrido Guiado

## Instrucciones Previas

### Opción A: Ambiente Local (Desarrollo)
```bash
npm install
npm run dev
# La app estará en http://localhost:3000
```

### Opción B: Ambiente Producción (Vercel)
App desplegada en: `https://pulperia.vercel.app`

---

## CREDENCIALES DEMO

**Usuario demo:** demo@pulperia.test  
**Contraseña demo:** DemoPass123!

> **Nota:** Este usuario de demo solo tiene permiso para ver la app. No puede modificar datos de producción. Todos los cambios se hacen en un ambiente aislado.

---

## RECORRIDO GUIADO (5 MINUTOS)

### ⚠️ IMPORTANTE - EJECUTAR ANTES DE EMPEZAR

Antes de que tu profesor inicie el recorrido, **debes crear los datos demo** en tu BD Supabase:

**Pasos:**
1. Ve a tu dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto `yhxmbkojqqffwxrwgdzq`
3. Ve a **Authentication → Users**
4. Haz clic en **Add user**
5. Email: `demo@pulperia.test`
6. Password: `DemoPass123!`
7. Click **Save**
8. Ve a **SQL Editor**
9. Copia y pega el contenido de `supabase/demo-setup.sql`
10. Click **Run**
11. Verifica que veas resultados como: `cliente_count: 4, producto_count: 10, venta_count: 3`

Si todo está bien, tu profesor puede seguir los pasos abajo:

---

## PASO 1: CATÁLOGO Y LOGIN

**URL:** `http://localhost:3000` (o `https://pulperia.vercel.app`)

**Qué hace el profesor:**
1. Abre la URL
2. Ve la página de login
3. Ingresa:
   - Email: `demo@pulperia.test`
   - Contraseña: `DemoPass123!`
4. Hace clic en "Iniciar sesión"

**Qué debe ver:**
- ✅ Página de login segura con validación
- ✅ Redirección automática al dashboard después de login
- ✅ Sesión confirmada (email visible en navbar)
- ✅ Barra de navegación con menú: Dashboard, Clientes, Productos, Ventas
- ✅ Mensaje de bienvenida o resumen del negocio

**Tiempo estimado:** 1 minuto

---

## PASO 2: GESTIÓN DE PRODUCTOS

**URL:** `http://localhost:3000/productos` (o `https://pulperia.vercel.app/productos`)

**Qué hace el profesor:**
1. Desde el navbar, hace clic en "Productos"
2. Observa la lista de productos disponibles
3. (Opcional) Busca un producto específico o filtra por stock bajo

**Qué debe ver:**
- ✅ Lista de 10 productos demo:
  - Nombre (ej: "Arroz (Libra)")
  - Precio (ej: "$1.50")
  - Stock actual (ej: "100 unidades")
  - Stock mínimo (alerta si está bajo)
  - Botón para editar o eliminar (solo para admin)
- ✅ Card layout limpio con información clara
- ✅ Opción para agregar nuevo producto
- ✅ Sin datos sensibles expuestos

**Tiempo estimado:** 1 minuto

---

## PASO 3: GESTIÓN DE CLIENTES Y CRÉDITOS

**URL:** `http://localhost:3000/clientes` (o `https://pulperia.vercel.app/clientes`)

**Qué hace el profesor:**
1. Desde el navbar, hace clic en "Clientes"
2. Observa la lista de clientes registrados
3. Haz clic en un cliente (ej: "Juan García López")
4. Ve los detalles: nombre, teléfono, dirección, saldo pendiente
5. (Opcional) Ve el historial de créditos (fiados) del cliente

**Qué debe ver:**
- ✅ Lista de 4 clientes demo con:
  - Nombre completo
  - Teléfono (formateado)
  - Dirección
  - **Saldo pendiente** (en rojo si hay deuda)
- ✅ Cards con diseño responsive
- ✅ Opción para crear nuevo cliente
- ✅ Opción para ver detalles de cliente
- ✅ En detalles: historial de créditos, pagos realizados
- ✅ Opción para registrar nuevo pago (si hay crédito pendiente)

**Tiempo estimado:** 1.5 minutos

---

## PASO 4: REGISTRO DE VENTAS E HISTORIAL

**URL:** `http://localhost:3000/ventas` (o `https://pulperia.vercel.app/ventas`)

**Qué hace el profesor:**
1. Desde el navbar, hace clic en "Ventas"
2. Observa el historial de 3 ventas demo
3. Haz clic en una venta para ver detalles
4. Observa:
   - Cliente que compró
   - Productos en la venta
   - Cantidades y precios
   - Total de la venta
   - Tipo de pago (contado/fiado)
   - Fecha y hora

**Qué debe ver:**
- ✅ Tabla o lista de ventas recientes con:
  - ID de venta (ej: "#001")
  - Cliente (ej: "Juan García López")
  - Fecha (ej: "15 de enero, 10:30 AM")
  - Total (ej: "$15.50")
  - Estado/tipo de pago (Contado/Fiado)
- ✅ Opción para crear nueva venta
- ✅ En detalles de venta:
  - Desglose de productos (nombre, cantidad, precio unitario, subtotal)
  - Total con impuestos (si aplica)
  - Métodos de pago disponibles
  - Auditoría: quién creó la venta y cuándo
- ✅ Validaciones de inputs (no permite productos sin stock, montos negativos, etc.)

**Tiempo estimado:** 1.5 minutos

---

## VERIFICACIÓN FINAL (30 segundos)

Después de los 4 pasos, tu profesor debe verificar:

- ✅ **Autenticación:** Login y logout funcionan
- ✅ **Autorización:** Solo puede ver datos del negocio, no información de otros usuarios
- ✅ **Validación de datos:** Intentar ingresar datos inválidos (email sin @, monto negativo) muestra error
- ✅ **Performance:** La app responde en < 2 segundos
- ✅ **Responsive:** Funciona en desktop y móvil
- ✅ **Auditoría:** Cada acción queda registrada (visible en detalles)

---

## TROUBLESHOOTING

### ❌ Error: "Credenciales inválidas"
- Verifica que hayas creado el usuario demo en Supabase Auth
- Confirma que la contraseña es exactamente: `DemoPass123!`
- Revisa que estés usando el email correcto: `demo@pulperia.test`

### ❌ Error: "No hay clientes/productos"
- Ejecuta el script SQL `supabase/demo-setup.sql` en Supabase Editor
- Verifica que no haya errores en la ejecución

### ❌ Página en blanco o error de conexión
- Revisa que `.env.local` tenga las credenciales correctas de Supabase
- Verifica que Redis esté disponible (o caché en memoria está activo)
- En consola del navegador (F12), busca errores

### ❌ Imágenes de productos no se ven
- Las imágenes usan datos de ejemplo, es normal que no existan URLs reales
- La funcionalidad de upload de imágenes está implementada pero desactivada en demo

---

## ENDPOINT TÉCNICO: Health Check

Para verificar que la API está disponible, tu profesor puede hacer:

**URL:** `http://localhost:3000/api/health` (o `https://pulperia.vercel.app/api/health`)

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## SEGURIDAD Y PRIVACIDAD

- ✅ Las credenciales demo NO son las credenciales de producción
- ✅ El usuario demo tiene permisos limitados (solo lectura de datos)
- ✅ La sesión expira después de 24 horas
- ✅ Todas las acciones están auditadas en la BD
- ✅ Las contraseñas se transmiten encriptadas (HTTPS)
- ✅ No hay cookies con información sensible en el navegador

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo modificar datos del usuario demo?**  
R: No. El usuario demo solo tiene permisos de lectura. Los cambios harían inconsistencia en los datos de prueba.

**P: ¿Dónde ves los datos de créditos (fiados)?**  
R: En la página de **Clientes** → selecciona un cliente → ves sección "Créditos Pendientes"

**P: ¿Cómo se calcula el saldo de un cliente?**  
R: Suma de todos los créditos minus los pagos realizados. Se actualiza en tiempo real.

**P: ¿Por qué algunos productos tienen stock bajo?**  
R: Los productos con stock < stock_minimo se marcan en rojo para alertar al pulpero que debe reabastecer.

**P: ¿Se pueden ver reportes o analíticas?**  
R: En el **Dashboard** hay un resumen con:
- Total de ventas hoy/mes
- Clientes activos
- Productos de bajo stock
- Ingresos totales

---

## DURACIÓN TOTAL DEL RECORRIDO

- ⏱️ Paso 1 (Login + Catálogo): 1 minuto
- ⏱️ Paso 2 (Productos): 1 minuto  
- ⏱️ Paso 3 (Clientes): 1.5 minutos
- ⏱️ Paso 4 (Ventas): 1.5 minutos
- ⏱️ Verificación final: 0.5 minutos
- **Total: 5 minutos**

---

## CONTACTO Y SOPORTE

Si tu profesor tiene dudas durante el recorrido:
- Email: levapo97@gmail.com
- GitHub: https://github.com/JIveth-14
- Documentación completa: Ver `README.md` en el repo

