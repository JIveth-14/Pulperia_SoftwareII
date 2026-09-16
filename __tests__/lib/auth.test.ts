import { createServerClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { middleware, config } from '@/middleware'
import { NextResponse } from 'next/server'

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/supabase/env', () => ({
  getSupabaseEnv: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({
      type: 'next',
      headers: { set: jest.fn() },
      cookies: { set: jest.fn(), getAll: jest.fn().mockReturnValue([]) },
    })),
    redirect: jest.fn((url: URL) => ({
      type: 'redirect',
      url: String(url),
      cookies: { delete: jest.fn(), set: jest.fn() },
    })),
  },
}))

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetSupabaseEnv = getSupabaseEnv as jest.MockedFunction<typeof getSupabaseEnv>
const mockNextResponse = NextResponse as unknown as {
  next: jest.Mock
  redirect: jest.Mock
}

describe('next auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSupabaseEnv.mockReturnValue({
      url: 'https://demo.supabase.co',
      anonKey: 'anon-key',
    } as ReturnType<typeof getSupabaseEnv>)
  })

  const createRequest = (pathname: string, demoCookie?: string) =>
    ({
      headers: new Headers(),
      cookies: {
        getAll: jest.fn().mockReturnValue([{ name: 'session', value: 'abc' }]),
        get: jest.fn().mockReturnValue(demoCookie ? { value: demoCookie } : undefined),
        set: jest.fn(),
      },
      nextUrl: { pathname },
      url: `https://pulperia.test${pathname}`,
    } as any)

  it('allows public routes for unauthenticated users', async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/login'))

    // Assert
    expect(mockNextResponse.redirect).not.toHaveBeenCalled()
    expect(response).toMatchObject({ type: 'next' })
  })

  it('redirects unauthenticated users away from private routes', async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/dashboard'))

    // Assert
    expect(mockNextResponse.redirect).toHaveBeenCalled()
    expect(response).toMatchObject({
      type: 'redirect',
      url: 'https://pulperia.test/login',
    })
  })

  it('redirects authenticated users from login to dashboard', async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/login'))

    // Assert
    expect(response).toMatchObject({
      type: 'redirect',
      url: 'https://pulperia.test/dashboard',
    })
  })

  it('returns the response for authenticated private routes', async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/clientes/12'))

    // Assert
    expect(response).toMatchObject({ type: 'next' })
    expect(mockGetSupabaseEnv).toHaveBeenCalled()
  })

  it('wires cookie synchronization through the Supabase client adapter', async () => {
    // Arrange
    const request = createRequest('/dashboard')
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any)

    // Act
    await middleware(request)
    const options = mockCreateServerClient.mock.calls[0][2]
    options.cookies.getAll()
    options.cookies.setAll([{ name: 'sb', value: 'token', options: { secure: true } }])

    // Assert: lee del request y escribe la cookie renovada en request y response
    expect(request.cookies.getAll).toHaveBeenCalled()
    expect(request.cookies.set).toHaveBeenCalledWith('sb', 'token')
    expect(mockNextResponse.next).toHaveBeenCalledTimes(2)
    const refreshed = mockNextResponse.next.mock.results[1].value
    expect(refreshed.cookies.set).toHaveBeenCalledWith('sb', 'token', { secure: true })
  })

  it('keeps refreshed session cookies when redirecting', async () => {
    // Arrange
    const refreshedCookie = { name: 'sb', value: 'new-token' }
    mockNextResponse.next.mockReturnValueOnce({
      type: 'next',
      headers: { set: jest.fn() },
      cookies: { set: jest.fn(), getAll: jest.fn().mockReturnValue([refreshedCookie]) },
    })
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/login'))

    // Assert
    expect(response.cookies.set).toHaveBeenCalledWith(refreshedCookie)
  })

  it('does not treat similarly named public paths as protected', async () => {
    // Arrange
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any)

    // Act
    const response = await middleware(createRequest('/clientes-info'))

    // Assert
    expect(response).toMatchObject({ type: 'next' })
  })

  it('redirects private routes to login when the auth check throws', async () => {
    // Arrange
    mockGetSupabaseEnv.mockImplementation(() => {
      throw new Error('missing env')
    })

    // Act
    const response = await middleware(createRequest('/ventas'))

    // Assert
    expect(response).toMatchObject({
      type: 'redirect',
      url: 'https://pulperia.test/login',
    })
  })

  it('keeps the public matcher configuration intact', () => {
    expect(config.matcher).toEqual([
      '/demo/:path*',
      '/dashboard/:path*',
      '/clientes/:path*',
      '/productos/:path*',
      '/ventas/:path*',
      '/login',
    ])
  })
})
