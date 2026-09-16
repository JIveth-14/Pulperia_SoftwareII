/**
 * @jest-environment node
 */
import { GET } from '@/app/(demo)/demo/salir/route'
import { DEMO_COOKIE } from '@/lib/demo/demo-config'

const request = (headers: Record<string, string> = {}) =>
  new Request('https://pulperia.test/demo/salir', { headers })

describe('GET /demo/salir', () => {
  it('cierra la sesión demo y redirige al inicio en un clic real', () => {
    const res = GET(request())

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://pulperia.test/')
    expect(res.headers.get('set-cookie')).toContain(`${DEMO_COOKIE}=;`)
  })

  it.each([
    ['next-router-prefetch', '1'],
    ['purpose', 'prefetch'],
    ['sec-purpose', 'prefetch;prerender'],
  ])('no toca la sesión cuando la petición es una precarga (%s)', (name, value) => {
    const res = GET(request({ [name]: value }))

    expect(res.status).toBe(204)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})
