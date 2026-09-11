const mockSignInWithPassword = jest.fn()
const mockCreateServerClient = jest.fn()
const mockCookies = jest.fn()
const mockGetSupabaseEnv = jest.fn()
const mockGetAll = jest.fn()
const mockSet = jest.fn()
const mockJson = jest.fn((body: unknown, init?: { status?: number }) => ({
  status: init?.status ?? 200,
  json: async () => body,
}))

jest.mock('@supabase/ssr', () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}))

jest.mock('next/headers', () => ({
  cookies: (...args: unknown[]) => mockCookies(...args),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => mockJson(body, init),
  },
}))

jest.mock('@/lib/supabase/env', () => ({
  getSupabaseEnv: (...args: unknown[]) => mockGetSupabaseEnv(...args),
}))

import { POST } from './route'

describe('POST /api/auth/login', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockSignInWithPassword.mockReset()
    mockCreateServerClient.mockReset()
    mockCookies.mockReset()
    mockGetSupabaseEnv.mockReset()
    mockGetAll.mockReset()
    mockJson.mockReset()
    mockSet.mockReset()
    mockJson.mockImplementation((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }))

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    mockGetAll.mockReturnValue([])
    mockSet.mockImplementation(() => undefined)
    mockCookies.mockResolvedValue({
      getAll: mockGetAll,
      set: mockSet,
    })
    mockGetSupabaseEnv.mockReturnValue({
      url: 'https://example.supabase.co',
      anonKey: 'test-anon-key',
    })
    mockCreateServerClient.mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('returns 200 when authentication succeeds', async () => {
    const credentials = {
      email: 'juan@example.com',
      password: 'secret123',
    }
    const data = {
      user: { id: 'user-123' },
      session: { access_token: 'token' },
    }

    mockSignInWithPassword.mockResolvedValue({
      data,
      error: null,
    })

    const request = {
      json: jest.fn().mockResolvedValue(credentials),
    } as never

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data })
    expect(mockSignInWithPassword).toHaveBeenCalledWith(credentials)
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )

    const clientOptions = mockCreateServerClient.mock.calls[0][2]
    clientOptions.cookies.getAll()
    clientOptions.cookies.setAll([
      {
        name: 'sb-access-token',
        value: 'token',
        options: { httpOnly: true },
      },
    ])

    expect(mockGetAll).toHaveBeenCalled()
    expect(mockSet).toHaveBeenCalledWith('sb-access-token', 'token', { httpOnly: true })
  })

  it('returns 400 when Supabase returns an auth error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const request = {
      json: jest.fn().mockResolvedValue({
        email: 'juan@example.com',
        password: 'wrong-password',
      }),
    } as never

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: 'Invalid login credentials' })
  })

  it('returns 500 when request processing throws', async () => {
    const request = {
      json: jest.fn().mockRejectedValue(new Error('boom')),
    } as never

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Error interno del servidor: boom' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('returns 500 when Supabase env resolution throws', async () => {
    mockGetSupabaseEnv.mockImplementation(() => {
      throw new Error('missing env')
    })

    const request = {
      json: jest.fn().mockResolvedValue({
        email: 'juan@example.com',
        password: 'secret123',
      }),
    } as never

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Error interno del servidor: missing env' })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })
})
