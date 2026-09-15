import { createServerClient } from '@supabase/ssr'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { middleware, config } from '@/middleware'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
      cookies: { set: jest.fn() },
    })),
    redirect: jest.fn((url: URL) => ({
      type: 'redirect',
      url: String(url),
      cookies: { delete: jest.fn() },
    })),
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetSupabaseEnv = getSupabaseEnv as jest.MockedFunction<typeof getSupabaseEnv>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>
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
    mockCookies.mockResolvedValue({
      getAll: jest.fn().mockReturnValue([{ name: 'session', value: 'abc' }]),
      set: jest.fn(),
    } as any)
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
    const response = await middleware(createRequest('/app/dashboard'))

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
    const response = await middleware(createRequest('/app/clientes'))

    // Assert
    expect(response).toMatchObject({ type: 'next' })
    expect(mockGetSupabaseEnv).toHaveBeenCalled()
  })

  it('wires cookie synchronization through the Supabase client adapter', async () => {
    // Arrange
    const request = createRequest('/app/dashboard')
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

    // Assert
    const cookieStore = await mockCookies.mock.results[0].value
    expect(cookieStore.getAll).toHaveBeenCalled()
    expect(cookieStore.set).toHaveBeenCalledWith('sb', 'token', { secure: true })
    expect(mockNextResponse.next).toHaveBeenCalledTimes(1)
  })

  it('keeps the public matcher configuration intact', () => {
    expect(config.matcher).toEqual([
      '/demo/:path*',
      '/(app)/:path*',
      '/app/:path*',
      '/dashboard/:path*',
      '/clientes/:path*',
      '/productos/:path*',
      '/ventas/:path*',
      '/login',
    ])
  })
})
