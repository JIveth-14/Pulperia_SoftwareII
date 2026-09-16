describe('supabase helpers', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  it('sanitizes quoted env values and removes a trailing slash', async () => {
    // Arrange
    process.env.NEXT_PUBLIC_SUPABASE_URL = ' "https://demo.supabase.co///" '
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = " 'anon-key' "

    // Act
    const { getSupabaseEnv } = await import('@/lib/supabase/env')

    // Assert
    expect(getSupabaseEnv()).toEqual({
      url: 'https://demo.supabase.co',
      anonKey: 'anon-key',
    })
  })

  it('throws when required env variables are missing', async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Act
    const { getSupabaseEnv } = await import('@/lib/supabase/env')

    // Assert
    expect(() => getSupabaseEnv()).toThrow(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en las variables de entorno'
    )
  })

  it('creates a browser client with sanitized env values', async () => {
    // Arrange
    const mockCreateBrowserClient = jest.fn().mockReturnValue({ kind: 'browser-client' })
    jest.doMock('@supabase/ssr', () => ({
      createBrowserClient: mockCreateBrowserClient,
    }))
    jest.doMock('@/lib/supabase/env', () => ({
      getSupabaseEnv: () => ({ url: 'https://demo.supabase.co', anonKey: 'anon-key' }),
    }))

    // Act
    const { createClient } = await import('@/lib/supabase/client')
    const client = createClient()

    // Assert
    expect(mockCreateBrowserClient).toHaveBeenCalledWith('https://demo.supabase.co', 'anon-key')
    expect(client).toEqual({ kind: 'browser-client' })
  })

  it('creates a server client wired to next cookies', async () => {
    // Arrange
    const cookieStore = {
      getAll: jest.fn().mockReturnValue([{ name: 'session', value: 'abc' }]),
      set: jest.fn(),
    }
    const mockCreateServerClient = jest.fn().mockReturnValue({ kind: 'server-client' })
    const mockCookies = jest.fn().mockResolvedValue(cookieStore)

    jest.doMock('@supabase/ssr', () => ({
      createServerClient: mockCreateServerClient,
    }))
    jest.doMock('next/headers', () => ({
      cookies: mockCookies,
    }))
    jest.doMock('@/lib/supabase/env', () => ({
      getSupabaseEnv: () => ({ url: 'https://demo.supabase.co', anonKey: 'anon-key' }),
    }))

    // Act
    const { createClient } = await import('@/lib/supabase/server')
    const client = await createClient()
    const options = mockCreateServerClient.mock.calls[0][2]

    // Assert
    expect(client).toEqual({ kind: 'server-client' })
    expect(mockCookies).toHaveBeenCalled()
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://demo.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )
    expect(options.cookies.getAll()).toEqual([{ name: 'session', value: 'abc' }])

    options.cookies.setAll([{ name: 'sb', value: 'token', options: { httpOnly: true } }])
    expect(cookieStore.set).toHaveBeenCalledWith('sb', 'token', { httpOnly: true })
  })

  it('swallows read-only cookie write errors in server components', async () => {
    // Arrange
    const cookieStore = {
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(() => {
        throw new Error('read only')
      }),
    }
    const mockCreateServerClient = jest.fn().mockReturnValue({ kind: 'server-client' })

    jest.doMock('@supabase/ssr', () => ({
      createServerClient: mockCreateServerClient,
    }))
    jest.doMock('next/headers', () => ({
      cookies: jest.fn().mockResolvedValue(cookieStore),
    }))
    jest.doMock('@/lib/supabase/env', () => ({
      getSupabaseEnv: () => ({ url: 'https://demo.supabase.co', anonKey: 'anon-key' }),
    }))

    // Act
    const { createClient } = await import('@/lib/supabase/server')
    await createClient()
    const options = mockCreateServerClient.mock.calls[0][2]

    // Assert
    expect(() =>
      options.cookies.setAll([{ name: 'sb', value: 'token', options: { secure: true } }])
    ).not.toThrow()
  })

  it('returns the current user and supports the session guard and sign-out', async () => {
    // Arrange
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
        signOut: jest.fn().mockResolvedValue(undefined),
      },
    }
    const mockCreateClient = jest.fn().mockResolvedValue(mockSupabase)
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: mockCreateClient,
    }))

    // Act
    const { getUser, exigirSesion, signOut } = await import('@/lib/supabase/server-utils')
    const user = await getUser()
    const sessionUser = await exigirSesion()
    await signOut()

    // Assert
    expect(user).toEqual({ id: 'user-1' })
    expect(sessionUser).toEqual({ id: 'user-1' })
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('redirects to login from exigirSesion when there is no session', async () => {
    // Arrange
    jest.doMock('@/lib/supabase/server', () => ({
      createClient: jest.fn().mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
          signOut: jest.fn(),
        },
      }),
    }))

    jest.doMock('next/navigation', () => ({
      redirect: jest.fn((url: string) => {
        throw new Error(`NEXT_REDIRECT:${url}`)
      }),
    }))

    // Act
    const { exigirSesion } = await import('@/lib/supabase/server-utils')

    // Assert
    await expect(exigirSesion()).rejects.toThrow('NEXT_REDIRECT:/login')
  })
})
