# 🔴 Modo Demo — Guía rápida (5 minutos)

La demo es una versión de **solo lectura** de Pulpería, con **datos ficticios**,
integrada en la misma app y el mismo deploy de Vercel.

## Acceder

- **Producción / app real:** `https://<tu-app>.vercel.app/` → inicia sesión
- **Demo:** `https://<tu-app>.vercel.app/demo` → login demo (`/demo/login`)

En local:

```bash
npm run dev
# App real:  http://localhost:3000
# Demo:      http://localhost:3000/demo   (redirige a /demo/login)
```

## Credenciales demo

La demo tiene su propio login, **separado del login real de Supabase**, ya
vienen precargadas en el formulario:

- Usuario: `demo@app.com`
- Contraseña: `Demo2026!`

Son **estáticas** a propósito: la demo es de solo lectura y usa datos en
memoria, así que estas credenciales no dan acceso a nada real. El formulario
las valida contra constantes (`validateDemoCredentials`), nunca contra Supabase.

## Qué puedes hacer

- Ver **Dashboard**, **Clientes**, **Productos** y **Ventas** con datos de ejemplo.
- Explorar la interfaz idéntica a producción.

## Qué NO puedes hacer (por diseño)

- ❌ Crear, editar o eliminar (los botones aparecen deshabilitados).
- ❌ Tocar la base de datos real: la demo usa datos **en memoria**, no Supabase.

## Sesión

- Duración: **30 minutos**. Un contador en el banner muestra el tiempo restante.
- Al expirar, se redirige a `/demo/expirado`, desde donde puedes **reiniciar**.
- Botón **"Salir de la demo"** disponible siempre en el banner.

## ¿Cómo está construido?

| Pieza | Archivo |
|-------|---------|
| Detección de `/demo` + guard de sesión | `src/middleware.ts` |
| Configuración + validación credenciales | `src/lib/demo/demo-config.ts` |
| Datos ficticios en memoria | `src/lib/demo/demo-data.ts` |
| Sesión (cookie) | `src/lib/demo/session.ts` |
| Login demo (UI) | `src/app/(demo)/demo/login/page.tsx` |
| Login demo (procesa + crea sesión) | `src/app/(demo)/demo/entrar/route.ts` |
| Layout + banner | `src/app/(demo)/demo/(main)/` |
| Páginas demo | `src/app/(demo)/demo/(main)/{clientes,productos,ventas}` |
| Expiración / salida | `src/app/(demo)/demo/{expirado,salir}` |
| Seed SQL opcional | `database/seeds/demo-seed.sql` |
