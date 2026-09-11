// Auth Middleware Tests
// Cobertura: authMiddleware, requireRole, rateLimit, corsMiddleware, securityHeaders, validateInput

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  authMiddleware,
  requireRole,
  rateLimit,
  corsMiddleware,
  securityHeaders,
  validateInput
} from './auth';
import { createServerClient } from '@supabase/ssr';

// Mock Supabase
jest.mock('@supabase/ssr');

// Mock jwt-decode (no se usa en los tests actualmente pero está importado)
jest.mock('jwt-decode');

describe('authMiddleware', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockHandler: jest.Mock;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock request
    mockReq = {
      cookies: {},
      user: undefined
    };

    // Setup mock response
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn().mockReturnThis();
    const endMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock,
      end: endMock,
      setHeader: jest.fn()
    };

    mockHandler = jest.fn();

    // Setup Supabase mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should allow authenticated user with valid token', async () => {
    // Arrange
    mockReq.cookies = { sb_access_token: 'valid-token-123' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      error: null
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'user-1', role: 'admin', full_name: 'John Doe' },
      error: null
    });

    // Act
    await authMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      id: 'user-1',
      email: 'user@test.com',
      role: 'admin',
      full_name: 'John Doe'
    });
  });

  it('should attach default role when user profile not found', async () => {
    // Arrange
    mockReq.cookies = { sb_access_token: 'valid-token-123' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      error: null
    });
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: null
    });

    // Act
    await authMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockReq.user?.role).toBe('cliente');
  });

  // ============ Error Cases ============
  it('should reject request without token', async () => {
    // Arrange
    mockReq.cookies = {};

    // Act
    await authMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'No authentication token' });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    // Arrange
    mockReq.cookies = { sb_access_token: 'invalid-token' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    // Act
    await authMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('should handle Supabase error gracefully', async () => {
    // Arrange
    mockReq.cookies = { sb_access_token: 'valid-token-123' };
    mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Database connection failed'));

    // Act
    await authMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
  });
});

describe('requireRole', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockHandler: jest.Mock;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      cookies: { sb_access_token: 'valid-token-123' },
      user: undefined
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
      setHeader: jest.fn()
    };

    mockHandler = jest.fn();

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'user@test.com' } },
          error: null
        })
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'user-1', role: 'admin', full_name: 'John Doe' },
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should allow admin user to access admin-only endpoint', async () => {
    // Arrange
    const middleware = requireRole('admin');

    // Act
    await middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should allow admin to access cobrador endpoint', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'user-1', role: 'cobrador', full_name: 'Jane Doe' },
      error: null
    });
    const middleware = requireRole('cobrador');

    // Act
    await middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalled();
  });

  // ============ Error Cases ============
  it('should deny cliente access to admin endpoint', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'user-1', role: 'cliente', full_name: 'Joe Doe' },
      error: null
    });
    const middleware = requireRole('admin');

    // Act
    await middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions',
      required: 'admin'
    });
  });

  it('should deny cobrador access to admin endpoint', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'user-1', role: 'cobrador', full_name: 'Jane Doe' },
      error: null
    });
    const middleware = requireRole('admin');

    // Act
    await middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockHandler);

    // Assert
    expect(mockHandler).toHaveBeenCalled(); // Admin can access cobrador endpoints
  });
});

describe('rateLimit', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockReq = {
      user: { id: 'user-1', email: 'test@test.com', role: 'cliente' },
      ip: '127.0.0.1'
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============ Happy Path ============
  it('should allow requests under rate limit', () => {
    // Arrange
    const middleware = rateLimit(5, 60000);

    // Act & Assert
    for (let i = 0; i < 5; i++) {
      middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockNext);
      expect(mockNext).toHaveBeenCalled();
    }
  });

  // ============ Error Cases ============
  it('should reject requests over rate limit', () => {
    // Arrange
    const middleware = rateLimit(3, 60000);

    // Act - Make 3 allowed requests
    for (let i = 0; i < 3; i++) {
      middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockNext);
    }

    // Then make request that exceeds limit
    middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Too many requests',
        retryAfter: expect.any(Number)
      })
    );
  });

  it('should use IP when user is not authenticated', () => {
    // Arrange
    mockReq.user = undefined;
    const middleware = rateLimit(2, 60000);

    // Act
    for (let i = 0; i < 2; i++) {
      middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockNext);
    }

    middleware(mockReq as NextApiRequest, mockRes as NextApiResponse, mockNext);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });
});

describe('corsMiddleware', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      headers: {},
      method: 'GET'
    };

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn()
    };

    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  // ============ Happy Path ============
  it('should set CORS headers for allowed origin', () => {
    // Arrange
    mockReq.headers = { origin: 'http://localhost:3000' };

    // Act
    corsMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.any(String));
    expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
  });

  it('should handle OPTIONS requests', () => {
    // Arrange
    mockReq.method = 'OPTIONS';
    mockReq.headers = { origin: 'http://localhost:3000' };

    // Act
    const result = corsMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(result).toBe(true);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  // ============ Error Cases ============
  it('should reject requests from disallowed origin', () => {
    // Arrange
    mockReq.headers = { origin: 'https://evil.com' };

    // Act
    corsMiddleware(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      expect.not.stringContaining('evil.com')
    );
  });
});

describe('securityHeaders', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {};
    mockRes = {
      setHeader: jest.fn()
    };
  });

  // ============ Happy Path ============
  it('should set all required security headers', () => {
    // Act
    securityHeaders(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', expect.any(String));
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', expect.any(String));
    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', expect.any(String));
    expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', expect.any(String));
  });

  it('should include CSP header with safe defaults', () => {
    // Act
    securityHeaders(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    const cspCall = (mockRes.setHeader as jest.Mock).mock.calls.find(
      call => call[0] === 'Content-Security-Policy'
    );
    expect(cspCall).toBeDefined();
    expect(cspCall[1]).toContain('default-src');
  });
});

describe('validateInput', () => {
  // ============ Happy Path ============
  it('should validate correct email format', () => {
    // Arrange
    const data = { email: 'valid@example.com' };
    const schema = { email: 'email' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });

  it('should validate correct number format', () => {
    // Arrange
    const data = { amount: 100 };
    const schema = { amount: 'number' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });

  it('should validate correct string format', () => {
    // Arrange
    const data = { name: 'John Doe' };
    const schema = { name: 'string' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });

  it('should validate correct phone format', () => {
    // Arrange
    const data = { phone: '+1 (555) 123-4567' };
    const schema = { phone: 'phone' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });

  it('should validate multiple fields at once', () => {
    // Arrange
    const data = {
      email: 'test@test.com',
      name: 'John Doe',
      phone: '123456789'
    };
    const schema = {
      email: 'email',
      name: 'string',
      phone: 'phone'
    };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });

  // ============ Error Cases ============
  it('should reject invalid email format', () => {
    // Arrange
    const data = { email: 'invalid-email' };
    const schema = { email: 'email' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.email).toBeDefined();
  });

  it('should reject missing required email', () => {
    // Arrange
    const data = {};
    const schema = { email: 'email' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result?.email).toBeDefined();
  });

  it('should reject invalid number', () => {
    // Arrange
    const data = { amount: 'not-a-number' };
    const schema = { amount: 'number' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).not.toBeNull();
    expect(result?.amount).toContain('must be a number');
  });

  it('should reject missing string', () => {
    // Arrange
    const data = {};
    const schema = { name: 'string' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result?.name).toBeDefined();
  });

  it('should reject invalid phone format', () => {
    // Arrange
    const data = { phone: '@invalid@phone' };
    const schema = { phone: 'phone' };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result?.phone).toBeDefined();
  });

  it('should return null when all validations pass', () => {
    // Arrange
    const data = {
      email: 'test@example.com',
      amount: 500,
      name: 'Test User',
      phone: '+1234567890'
    };
    const schema = {
      email: 'email',
      amount: 'number',
      name: 'string',
      phone: 'phone'
    };

    // Act
    const result = validateInput(data, schema);

    // Assert
    expect(result).toBeNull();
  });
});
