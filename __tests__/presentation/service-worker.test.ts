/**
 * @jest-environment node
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

type Handler = (event: Record<string, unknown>) => void

/** Carga public/sw.js en un entorno falso y devuelve sus manejadores. */
function cargarServiceWorker(cachesExistentes: string[] = []) {
  const handlers: Record<string, Handler> = {}
  const borradas: string[] = []
  const cache = { addAll: jest.fn().mockResolvedValue(undefined), put: jest.fn() }
  const contexto = {
    self: {
      location: { origin: 'https://pulperia.test' },
      addEventListener: (tipo: string, fn: Handler) => (handlers[tipo] = fn),
      skipWaiting: jest.fn(),
      clients: { claim: jest.fn() },
    },
    caches: {
      open: jest.fn().mockResolvedValue(cache),
      keys: jest.fn().mockResolvedValue(cachesExistentes),
      delete: jest.fn(async (n: string) => borradas.push(n)),
      match: jest.fn().mockResolvedValue(undefined),
    },
    fetch: jest.fn().mockResolvedValue({ ok: true, clone: () => ({}) }),
    URL,
    Promise,
  }
  vm.runInNewContext(readFileSync(path.join(process.cwd(), 'public', 'sw.js'), 'utf8'), contexto)
  return { handlers, borradas, cache, contexto }
}

function evento(url: string, extra: Record<string, unknown> = {}) {
  const respondWith = jest.fn()
  return { respondWith, request: { method: 'GET', mode: 'cors', url, ...extra } }
}

describe('service worker', () => {
  it('no intercepta la API, los datos RSC ni otros orígenes (nunca cachea datos privados)', () => {
    const { handlers } = cargarServiceWorker()

    for (const url of [
      'https://pulperia.test/api/auth/login',
      'https://pulperia.test/clientes?_rsc=abc',
      'https://otro.test/_next/static/x.js',
    ]) {
      const e = evento(url)
      handlers.fetch(e)
      expect(e.respondWith).not.toHaveBeenCalled()
    }

    const post = evento('https://pulperia.test/_next/static/app.js', { method: 'POST' })
    handlers.fetch(post)
    expect(post.respondWith).not.toHaveBeenCalled()
  })

  it('las navegaciones van a la red y sin conexión muestran la página offline', async () => {
    const { handlers, contexto } = cargarServiceWorker()
    contexto.fetch.mockRejectedValueOnce(new Error('offline'))
    const offline = { status: 200 }
    contexto.caches.match.mockResolvedValueOnce(offline)

    const e = evento('https://pulperia.test/clientes/4', { mode: 'navigate' })
    handlers.fetch(e)

    await expect(e.respondWith.mock.calls[0][0]).resolves.toBe(offline)
    expect(contexto.caches.match).toHaveBeenCalledWith('/offline.html')
  })

  it('cachea solo archivos estáticos', async () => {
    const { handlers, cache } = cargarServiceWorker()
    const e = evento('https://pulperia.test/_next/static/chunks/app.js')
    handlers.fetch(e)

    await e.respondWith.mock.calls[0][0]
    await new Promise((r) => setImmediate(r))
    expect(cache.put).toHaveBeenCalled()
  })

  it('al activarse borra las cachés de la versión anterior', async () => {
    const { handlers, borradas } = cargarServiceWorker([
      'pulperia-cache-v1',
      'pulperia-runtime-v1',
      'pulperia-api-v1',
      'pulperia-estatico-v2',
    ])
    let espera: Promise<unknown> = Promise.resolve()
    handlers.activate({ waitUntil: (p: Promise<unknown>) => (espera = p) })
    await espera

    expect(borradas.sort()).toEqual(['pulperia-api-v1', 'pulperia-cache-v1', 'pulperia-runtime-v1'])
  })

  it('el manifest usa íconos que existen', () => {
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'manifest.json'), 'utf8'))
    for (const icono of manifest.icons) {
      expect(() => readFileSync(path.join(process.cwd(), 'public', icono.src))).not.toThrow()
    }
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
  })
})
