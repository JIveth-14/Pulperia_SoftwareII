// Credits API Tests
// Cobertura: getCredits, createCredit, getCreditById, updateCredit, deleteCredit, handler

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getCredits,
  createCredit,
  getCreditById,
  updateCredit,
  deleteCredit,
  default as handler
} from './credits';
import { createServerClient } from '@supabase/ssr';
import { authMiddleware } from '@/middleware/auth';

// Mocks
jest.mock('@supabase/ssr');
jest.mock('@/middleware/auth');

describe('getCredits', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 'user-1', email: 'test@test.com', role: 'cliente' },
      method: 'GET'
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should return list of credits for authenticated user', async () => {
    // Arrange
    const mockCredits = [
      {
        id: 1,
        amount: 1000,
        interest_rate: 5,
        remaining_balance: 950,
        status: 'active',
        due_date: '2024-12-31',
        created_at: '2024-01-01',
        customer: {
          id: 'cust-1',
          first_name: 'John',
          last_name: 'Doe',
          phone: '123-456-7890',
          email: 'john@test.com'
        },
        created_by: { full_name: 'Admin User' }
      }
    ];

    mockSupabaseClient.order.mockResolvedValue({
      data: mockCredits,
      error: null
    });

    // Act
    await getCredits(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockCredits });
  });

  // ============ Error Cases ============
  it('should return 401 when user is not authenticated', async () => {
    // Arrange
    mockReq.user = undefined;

    // Act
    await getCredits(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should handle database error', async () => {
    // Arrange
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });

    // Act
    await getCredits(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Database error')
    });
  });
});

describe('createCredit', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
      method: 'POST',
      body: {
        customer_id: 'cust-1',
        amount: 1000,
        interest_rate: 5,
        due_date: '2024-12-31',
        notes: 'Test credit'
      }
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          customer_id: 'cust-1',
          amount: 1000,
          remaining_balance: 1050
        },
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should create credit successfully as admin', async () => {
    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 1,
        customer_id: 'cust-1',
        amount: 1000
      })
    });
  });

  it('should calculate remaining balance with interest', async () => {
    // Arrange
    mockReq.body = {
      customer_id: 'cust-1',
      amount: 1000,
      interest_rate: 10,
      due_date: '2024-12-31'
    };

    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert - verify insert was called with correct calculation
    const insertCall = mockSupabaseClient.insert.mock.calls[0][0][0];
    expect(insertCall.remaining_balance).toBe(1100); // 1000 + 10%
  });

  // ============ Error Cases ============
  it('should reject non-admin users', async () => {
    // Arrange
    mockReq.user = { id: 'user-1', email: 'user@test.com', role: 'cliente' };

    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should reject missing required fields', async () => {
    // Arrange
    mockReq.body = { customer_id: 'cust-1' }; // missing amount

    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Missing required fields'
    });
  });

  it('should handle database insertion error', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: new Error('Insertion failed')
    });

    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Insertion failed')
    });
  });

  it('should log audit event on creation', async () => {
    // Arrange
    const auditFromMock = jest.fn().mockReturnThis();
    const auditInsertMock = jest.fn().mockResolvedValue({ data: {}, error: null });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'audit_log') {
        return { insert: auditInsertMock };
      }
      return mockSupabaseClient;
    });

    // Act
    await createCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(auditInsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: 'user-1',
          action: 'CREATE',
          table_name: 'credits'
        })
      ])
    );
  });
});

describe('getCreditById', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: { id: '1' },
      method: 'GET'
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          customer_id: 'cust-1',
          amount: 1000,
          customer: {},
          payments: [],
          assignments: []
        },
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should return credit details with related data', async () => {
    // Act
    await getCreditById(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 1,
        customer_id: 'cust-1'
      })
    });
  });

  // ============ Error Cases ============
  it('should return 404 when credit not found', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: new Error('Not found')
    });

    // Act
    await getCreditById(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Credit not found' });
  });

  it('should handle database error', async () => {
    // Arrange
    mockSupabaseClient.single.mockRejectedValue(new Error('DB error'));

    // Act
    await getCreditById(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('DB error')
    });
  });
});

describe('updateCredit', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: { id: '1' },
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
      method: 'PUT',
      body: {
        status: 'completed',
        notes: 'Updated'
      }
    };

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 1, status: 'completed', notes: 'Updated' },
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should update credit successfully as admin', async () => {
    // Act
    await updateCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 1, status: 'completed' })
    });
  });

  // ============ Error Cases ============
  it('should reject non-admin users', async () => {
    // Arrange
    mockReq.user = { id: 'user-1', email: 'user@test.com', role: 'cliente' };

    // Act
    await updateCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should handle update error', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: new Error('Update failed')
    });

    // Act
    await updateCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Update failed')
    });
  });
});

describe('deleteCredit', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: { id: '1' },
      user: { id: 'user-1', email: 'admin@test.com', role: 'admin' },
      method: 'DELETE'
    };

    const statusMock = jest.fn().mockReturnThis();
    const endMock = jest.fn();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      end: endMock,
      json: jsonMock
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should delete credit successfully as admin', async () => {
    // Act
    await deleteCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(204);
    expect(mockRes.end).toHaveBeenCalled();
  });

  // ============ Error Cases ============
  it('should reject non-admin users', async () => {
    // Arrange
    mockReq.user = { id: 'user-1', email: 'user@test.com', role: 'cobrador' };

    // Act
    await deleteCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should handle delete error', async () => {
    // Arrange
    mockSupabaseClient.eq.mockResolvedValue({
      data: null,
      error: new Error('Delete failed')
    });

    // Act
    await deleteCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Delete failed')
    });
  });
});

describe('handler', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn();

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    (authMiddleware as jest.Mock).mockImplementation(
      (req, res, handlerFn) => handlerFn()
    );
  });

  // ============ Happy Path ============
  it('should route GET requests correctly', async () => {
    // Arrange
    mockReq = {
      method: 'GET',
      query: {}
    };

    (getCredits as jest.Mock) = jest.fn();

    // Act
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should handle method not allowed', async () => {
    // Arrange
    mockReq = { method: 'PATCH' };

    // Act
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(authMiddleware).toHaveBeenCalled();
  });
});
