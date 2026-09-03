# Pulpería – Sistema de Gestión de Negocio

Una aplicación web moderna para gestionar operaciones de una pulpería: inventario de productos, control de ventas, gestión de clientes y créditos. Construida con **Next.js 15**, **Tailwind CSS** y **Supabase**.

## Descripción del Proyecto

Pulpería es una solución integral para pequeños negocios que necesitan:

- **Gestión de Inventario**: Crear, editar y monitorear productos con alertas de bajo stock
- **Registro de Ventas**: Anotar ventas diarias, visualizar totales por día
- **Gestión de Clientes**: Mantener base de datos de clientes con historial de compras
- **Control de Créditos (Fiados)**: Registrar deudas pendientes y pagos realizados
- **Autenticación Segura**: Login con Supabase Auth, gestión de sesiones

## Stack Tecnológico

- **Frontend**: Next.js 15 (App Router, SSR)
- **Estilos**: Tailwind CSS + componentes reutilizables
- **Backend**: API Routes de Next.js
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions

## Instalación

### Requisitos previos
- Node.js 18+ y npm
- Cuenta de Supabase (gratuita en https://supabase.com)
- Git

### Pasos de configuración

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/JIveth-14/Pulperia_SoftwareII.git
   cd Pulperia_SoftwareII
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copiar `.env.example` a `.env.local`
   - Reemplazar con tus credenciales de Supabase:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
     ```

4. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000 en tu navegador

## Uso

### Autenticación
- Accede a `/login` con tus credenciales de Supabase
- El middleware protege todas las rutas excepto `/login` y `/`

### Flujo principal
1. Dashboard: Vista general de ventas del día
2. Clientes: Crear y buscar clientes, ver sus compras al crédito
3. Productos: Inventario, precios, alertas de bajo stock
4. Ventas: Registrar nuevas transacciones
5. Fiados: Control de créditos pendientes y pagos

## Estructura del Proyecto

```
src/
├── app/
│   ├── (app)/          # Rutas protegidas (requieren autenticación)
│   ├── api/            # API Routes
│   ├── login/          # Página de login
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página de inicio
├── lib/
│   └── supabase/       # Clientes de Supabase (client, server, env)
├── modules/            # Módulos por funcionalidad
│   ├── auth/
│   ├── clientes/
│   ├── fiados/
│   ├── pagos/
│   ├── productos/
│   ├── ventas/
│   └── dashboard/
├── repositories/       # Data access layer
├── components/         # Componentes reutilizables
└── middleware.ts       # Middleware de autenticación
```

## Testing

Ejecutar la suite de tests:
```bash
npm test
```

Tests incluidos:
- Validaciones de saldo en fiados
- Cálculos de total de ventas
- Alertas de bajo stock

## Deployment en Vercel

1. Push a GitHub
2. Conectar repositorio en Vercel
3. Configurar variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy automático en cada push a `main`

**Importante**: Las variables `NEXT_PUBLIC_*` se incrustan en el build. Cambiarlas requiere un redeploy.

## Troubleshooting

### Error: "Invalid path specified in request URL"
- Verificar que `NEXT_PUBLIC_SUPABASE_URL` no tenga espacios, comillas o barra final
- Realizar un redeploy después de cambiar variables de entorno

### Error: "Not authenticated"
- Verificar que la cookie de sesión está siendo guardada
- Limpiar cookies del navegador e intentar login de nuevo

## Contribuciones

Las contribuciones son bienvenidas. Para cambios mayores:
1. Fork el repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## Verificación de Propiedad

`LEARN-CAP-09C50C7F`

## Licencia

Este proyecto es de uso privado/educativo. Contactar al dueño para permisos de uso.

## Autor

Jessica Iveth P. Dubón (levapo97@gmail.com)
