/**
 * Servidor falso de Supabase para las pruebas E2E (Playwright).
 *
 * Implementa solo lo que usa la app: GoTrue (sesión y login) y un PostgREST
 * mínimo (select con filtros/orden/embeds, insert, update, delete y el RPC
 * crear_venta con las mismas reglas que la migración). Los datos viven en
 * memoria y se reinician con POST /__reset. NUNCA toca una base real.
 */
import http from 'node:http';

export const PUERTO = Number(process.env.FAKE_SUPABASE_PORT ?? 54329);
export const TOKEN = 'e2e-access-token';
export const USUARIO = { id: '00000000-0000-4000-8000-000000000001', email: 'dueno@pulperia.hn', aud: 'authenticated', role: 'authenticated' };
export const CREDENCIALES = { email: 'dueno@pulperia.hn', password: 'Pulperia2026!' };

const hace = (dias, horas = 0) => new Date(Date.now() - dias * 864e5 - horas * 36e5).toISOString();

function semilla() {
  return {
    clientes: [
      { id: 1, nombre: 'Ana García', telefono: '7654-3210', direccion: null, created_at: hace(30) },
      { id: 2, nombre: 'Carlos Reyes', telefono: '9943-6334', direccion: 'Río San Gaspar', created_at: hace(20) },
      { id: 3, nombre: 'María López', telefono: '9876-5432', direccion: 'Colonia El Prado, casa 14', created_at: hace(10) },
      { id: 4, nombre: 'Rosa Mendoza', telefono: '5432-1098', direccion: 'Col. La Esperanza, bloque B', created_at: hace(5) },
    ],
    productos: [
      { id: 1, nombre: 'Coca-Cola 600ml', precio: 18, stock: 24, stock_minimo: 10, created_at: hace(40) },
      { id: 2, nombre: 'Arroz 1lb', precio: 15, stock: 8, stock_minimo: 12, created_at: hace(40) },
      { id: 3, nombre: 'Café 250g', precio: 42.5, stock: 2, stock_minimo: 5, created_at: hace(40) },
    ],
    fiados: [
      { id: 1, cliente_id: 3, monto_total: 250, saldo_pendiente: 230, fecha: hace(8), estado: 'parcial', created_at: hace(8) },
      { id: 2, cliente_id: 2, monto_total: 60, saldo_pendiente: 60, fecha: hace(3), estado: 'pendiente', created_at: hace(3) },
    ],
    pagos: [{ id: 1, fiado_id: 1, monto_pagado: 20, fecha_pago: hace(4), created_at: hace(4) }],
    ventas: [
      { id: 1, cliente_id: null, tipo_pago: 'contado', total: 51, fecha: hace(0, 1), created_at: hace(0, 1) },
      { id: 2, cliente_id: 3, tipo_pago: 'fiado', total: 36, fecha: hace(2), created_at: hace(2) },
    ],
    detalle_venta: [
      { id: 1, venta_id: 1, producto_id: 1, cantidad: 2, precio_unitario: 18, subtotal: 36 },
      { id: 2, venta_id: 1, producto_id: 2, cantidad: 1, precio_unitario: 15, subtotal: 15 },
      { id: 3, venta_id: 2, producto_id: 1, cantidad: 2, precio_unitario: 18, subtotal: 36 },
    ],
  };
}

let db = semilla();
const siguienteId = (tabla) => Math.max(0, ...db[tabla].map((r) => r.id)) + 1;

function responder(res, status, cuerpo, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(cuerpo === undefined ? '' : JSON.stringify(cuerpo));
}

const errorPg = (res, status, code, message) => responder(res, status, { code, message, details: null, hint: null });

function leerCuerpo(req) {
  return new Promise((resolve) => {
    let datos = '';
    req.on('data', (c) => (datos += c));
    req.on('end', () => {
      try {
        resolve(datos ? JSON.parse(datos) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

/** Convierte `valor` del filtro al tipo de la columna. */
const comparable = (v) => (v !== null && v !== '' && !Number.isNaN(Number(v)) && typeof v !== 'boolean' ? Number(v) : v);

function cumple(fila, columna, expresion) {
  const [op, ...resto] = expresion.split('.');
  const valor = resto.join('.');
  const actual = fila[columna];
  switch (op) {
    case 'eq': return String(actual) === valor;
    case 'neq': return String(actual) !== valor;
    case 'gte': return comparable(actual) >= comparable(valor);
    case 'gt': return comparable(actual) > comparable(valor);
    case 'lte': return comparable(actual) <= comparable(valor);
    case 'lt': return comparable(actual) < comparable(valor);
    case 'in': return valor.replace(/^\(|\)$/g, '').split(',').includes(String(actual));
    case 'ilike': {
      const patron = new RegExp('^' + decodeURIComponent(valor).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
      return patron.test(String(actual ?? ''));
    }
    default: return true;
  }
}

/** Agrega las relaciones que la app pide en `select`. */
function conEmbeds(tabla, filas, select) {
  return filas.map((fila) => {
    const r = { ...fila };
    if (tabla === 'clientes' && /fiados\(/.test(select)) {
      r.fiados = db.fiados.filter((f) => f.cliente_id === fila.id).map((f) => ({ saldo_pendiente: f.saldo_pendiente }));
    }
    if (tabla === 'pagos' && /fiados!inner\(/.test(select)) {
      const fiado = db.fiados.find((f) => f.id === fila.fiado_id);
      r.fiados = fiado ? { cliente_id: fiado.cliente_id } : null;
    }
    if (tabla === 'ventas' && /detalle_venta\(/.test(select)) {
      r.detalle_venta = db.detalle_venta
        .filter((d) => d.venta_id === fila.id)
        .map((d) => ({ ...d, productos: db.productos.find((p) => p.id === d.producto_id) ?? null }));
    }
    if (tabla === 'ventas' && /clientes\(/.test(select)) {
      const c = db.clientes.find((x) => x.id === fila.cliente_id);
      r.clientes = c ? { id: c.id, nombre: c.nombre, telefono: c.telefono } : null;
    }
    return r;
  });
}

function filtrar(tabla, params) {
  let filas = db[tabla];
  for (const [clave, valor] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns'].includes(clave)) continue;
    if (clave === 'fiados.cliente_id' && tabla === 'pagos') {
      filas = filas.filter((p) => {
        const fiado = db.fiados.find((f) => f.id === p.fiado_id);
        return fiado && cumple(fiado, 'cliente_id', valor);
      });
      continue;
    }
    filas = filas.filter((f) => cumple(f, clave, valor));
  }
  const orden = params.get('order');
  if (orden) {
    const [col, dir = 'asc'] = orden.split(',')[0].split('.');
    filas = [...filas].sort((a, b) => {
      const x = comparable(a[col]), y = comparable(b[col]);
      const c = typeof x === 'string' ? String(x).localeCompare(String(y), 'es') : x - y;
      return dir === 'desc' ? -c : c;
    });
  }
  return filas;
}

function devolver(req, res, tabla, filas, params, status = 200) {
  const datos = conEmbeds(tabla, filas, params.get('select') ?? '*');
  if ((req.headers.accept ?? '').includes('vnd.pgrst.object+json')) {
    if (datos.length !== 1) {
      return errorPg(res, 406, 'PGRST116', `JSON object requested, multiple (or no) rows returned (${datos.length})`);
    }
    return responder(res, status, datos[0]);
  }
  return responder(res, status, datos);
}

function crearVenta({ p_lineas = [], p_cliente_id = null, p_tipo_pago = 'contado' }) {
  let total = 0;
  for (const l of p_lineas) {
    const p = db.productos.find((x) => x.id === Number(l.producto_id));
    if (!p) throw { code: 'P0001', message: `Producto ${l.producto_id} no existe` };
    if (p.stock < l.cantidad) {
      throw { code: 'P0001', message: `Stock insuficiente para producto ${p.id} (disponible: ${p.stock}, solicitado: ${l.cantidad})` };
    }
    total += p.precio * l.cantidad;
  }
  if (total <= 0) throw { code: 'P0001', message: 'El total de la venta debe ser mayor a 0' };

  const ahora = new Date().toISOString();
  const venta = { id: siguienteId('ventas'), cliente_id: p_cliente_id, tipo_pago: p_tipo_pago, total, fecha: ahora, created_at: ahora };
  db.ventas.push(venta);
  for (const l of p_lineas) {
    const p = db.productos.find((x) => x.id === Number(l.producto_id));
    p.stock -= l.cantidad;
    db.detalle_venta.push({ id: siguienteId('detalle_venta'), venta_id: venta.id, producto_id: p.id, cantidad: l.cantidad, precio_unitario: p.precio, subtotal: p.precio * l.cantidad });
  }
  if (p_tipo_pago === 'fiado' && p_cliente_id) {
    db.fiados.push({ id: siguienteId('fiados'), cliente_id: p_cliente_id, monto_total: total, saldo_pendiente: total, fecha: ahora, estado: 'pendiente', created_at: ahora });
  }
  return [{ venta_id: venta.id, total }];
}

/** Trigger trg_actualizar_saldo_fiado. */
function aplicarPago(pago) {
  const fiado = db.fiados.find((f) => f.id === pago.fiado_id);
  const saldo = Math.round((fiado.saldo_pendiente - pago.monto_pagado) * 100) / 100;
  if (saldo < 0) throw { code: 'P0001', message: `El pago (${pago.monto_pagado}) supera el saldo pendiente del fiado (${fiado.saldo_pendiente})` };
  fiado.saldo_pendiente = saldo;
  fiado.estado = saldo === 0 ? 'pagado' : saldo < fiado.monto_total ? 'parcial' : 'pendiente';
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PUERTO}`);
  const params = url.searchParams;

  if (req.method === 'OPTIONS') return responder(res, 204, undefined, { 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' });
  if (url.pathname === '/__reset' && req.method === 'POST') {
    db = semilla();
    return responder(res, 200, { ok: true });
  }
  if (url.pathname === '/__salud') return responder(res, 200, { ok: true });

  // ---------- GoTrue ----------
  if (url.pathname === '/auth/v1/user') {
    return req.headers.authorization === `Bearer ${TOKEN}`
      ? responder(res, 200, USUARIO)
      : responder(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' });
  }
  if (url.pathname === '/auth/v1/token' && req.method === 'POST') {
    const cuerpo = (await leerCuerpo(req)) ?? {};
    if (cuerpo.email !== CREDENCIALES.email || cuerpo.password !== CREDENCIALES.password) {
      return responder(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
    }
    return responder(res, 200, sesion());
  }
  if (url.pathname === '/auth/v1/logout') return responder(res, 204);

  // ---------- PostgREST ----------
  const rpc = url.pathname.match(/^\/rest\/v1\/rpc\/(\w+)$/);
  if (rpc) {
    if (rpc[1] !== 'crear_venta') return errorPg(res, 404, 'PGRST202', 'function not found');
    try {
      return responder(res, 200, crearVenta((await leerCuerpo(req)) ?? {}));
    } catch (e) {
      return errorPg(res, 400, e.code ?? 'P0001', e.message);
    }
  }

  const coincidencia = url.pathname.match(/^\/rest\/v1\/(\w+)$/);
  if (!coincidencia || !db[coincidencia[1]]) return errorPg(res, 404, '42P01', 'relation does not exist');
  const tabla = coincidencia[1];

  try {
    if (req.method === 'GET') return devolver(req, res, tabla, filtrar(tabla, params), params);

    if (req.method === 'POST') {
      const cuerpo = await leerCuerpo(req);
      const ahora = new Date().toISOString();
      const nuevas = (Array.isArray(cuerpo) ? cuerpo : [cuerpo]).map((fila) => {
        const nueva = { id: siguienteId(tabla), created_at: ahora, ...fila };
        if (tabla === 'pagos') {
          nueva.fecha_pago ??= ahora;
          aplicarPago(nueva);
        }
        if (tabla === 'fiados') nueva.fecha ??= ahora;
        db[tabla].push(nueva);
        return nueva;
      });
      return devolver(req, res, tabla, nuevas, params, 201);
    }

    if (req.method === 'PATCH') {
      const cambios = (await leerCuerpo(req)) ?? {};
      const filas = filtrar(tabla, params);
      filas.forEach((f) => Object.assign(f, cambios));
      return devolver(req, res, tabla, filas, params);
    }

    if (req.method === 'DELETE') {
      const filas = filtrar(tabla, params);
      if (tabla === 'productos' && filas.some((p) => db.detalle_venta.some((d) => d.producto_id === p.id))) {
        return errorPg(res, 409, '23503', 'update or delete on table "productos" violates foreign key constraint');
      }
      db[tabla] = db[tabla].filter((f) => !filas.includes(f));
      if (tabla === 'clientes') {
        const ids = new Set(filas.map((f) => f.id));
        const fiados = db.fiados.filter((f) => ids.has(f.cliente_id)).map((f) => f.id);
        db.fiados = db.fiados.filter((f) => !ids.has(f.cliente_id));
        db.pagos = db.pagos.filter((p) => !fiados.includes(p.fiado_id));
      }
      return responder(res, 204);
    }
  } catch (e) {
    return errorPg(res, 400, e.code ?? 'P0001', e.message ?? String(e));
  }

  return errorPg(res, 405, 'PGRST000', 'method not allowed');
});

export function sesion() {
  return {
    access_token: TOKEN,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    refresh_token: 'e2e-refresh-token',
    user: USUARIO,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  servidor.listen(PUERTO, () => console.log(`[fake-supabase] escuchando en http://localhost:${PUERTO}`));
}
