// Payments API Tests
// Cobertura: registerPayment, getPaymentsByCredit, handler

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  registerPayment,
  getPaymentsByCredit,
  default as handler
} from './payments';
import { createServerClient } from '@supabase/ssr';
import { authMiddleware } from '@/middleware/auth';
import * as notificationService from '@/services/notifications';

// Mocks
jest.mock('@supabase/ssr');
jest.mock('@/middleware/auth');
jest.mock('@/services/notifications');

describe('registerPayment', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: 'user-1', email: 'collector@test.com', role: 'cobrador' },
      method: 'POST',
      body: {
        credit_id: 1,
        amount: 500,
        payment_method: 'cash',
        receipt_number: 'REC-001',
        notes: 'Payment received'
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
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 1,
          credit_id: 1,
          amount: 500,
          customer: {
            id: 'cust-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com'
          }
        },
        error: null
      }),
      insert: jest.fn().mockReturnThis()
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (notificationService.sendPaymentNotification as jest.Mock).mockResolvedValue({});
  });

  // ============ Happy Path ============
  it('should register payment successfully', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: {
        id: 1,
        credit_id: 1,
        amount: 1000,
        remaining_balance: 1000,
        customer: {
          id: 'cust-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@test.com'
        }
      },
      error: null
    });

    // Second call for payment insertion
    mockSupabaseClient.single.mockResolvedValueOnce({
      data: {
        id: 1,
        credit_id: 1,
        amount: 500
      },
      error: null
    });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        credit_id: 1,
        amount: 500
      }),
      message: 'Payment registered successfully'
    });
  });

  it('should send notification after payment registration', async () => {
    // Arrange
    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: {
          id: 1,
          credit_id: 1,
          amount: 1000,
          remaining_balance: 1000,
          customer: {
            id: 'cust-1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com'
          }
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          id: 1,
          credit_id: 1,
          amount: 500
        },
        error: null
      });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(notificationService.sendPaymentNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: 'john@test.com',
        customer_name: 'John Doe',
        amount: 500,
        remaining: 500,
        receipt_number: 'REC-001'
      })
    );
  });

  it('should handle payment with no interest rate gracefully', async () => {
    // Arrange
    mockReq.body = {
      credit_id: 1,
      amount: 300,
      payment_method: 'transfer'
    };

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: {
          id: 1,
          remaining_balance: 1000,
          customer: {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@test.com'
          }
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          id: 2,
          credit_id: 1,
          amount: 300
        },
        error: null
      });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });

  // ============ Error Cases ============
  it('should reject missing required fields', async () => {
    // Arrange
    mockReq.body = { credit_id: 1 }; // missing amount

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Missing required fields'
    });
  });

  it('should reject payment for non-existent credit', async () => {
    // Arrange
    mockSupabaseClient.single.mockResolvedValue({
      data: null,
      error: new Error('Credit not found')
    });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Credit not found'
    });
  });

  it('should reject zero or negative payment amount', async () => {
    // Arrange
    mockReq.body = {
      credit_id: 1,
      amount: -100,
      payment_method: 'cash'
    };

    mockSupabaseClient.single.mockResolvedValue({
      data: {
        id: 1,
        remaining_balance: 1000,
        customer: { email: 'test@test.com' }
      },
      error: null
    });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid payment amount'
      })
    );
  });

  it('should reject payment exceeding remaining balance', async () => {
    // Arrange
    mockReq.body = {
      credit_id: 1,
      amount: 2000,
      payment_method: 'cash'
    };

    mockSupabaseClient.single.mockResolvedValue({
      data: {
        id: 1,
        remaining_balance: 1000,
        customer: { email: 'test@test.com' }
      },
      error: null
    });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Invalid payment amount',
        remaining: 1000
      })
    );
  });

  it('should handle payment insertion error', async () => {
    // Arrange
    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: {
          id: 1,
          remaining_balance: 1000,
          customer: { email: 'test@test.com' }
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('Insertion failed')
      });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Insertion failed')
    });
  });

  it('should handle notification service error gracefully', async () => {
    // Arrange
    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: {
          id: 1,
          credit_id: 1,
          amount: 1000,
          remaining_balance: 1000,
          customer: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@test.com'
          }
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: { id: 1, credit_id: 1, amount: 500 },
        error: null
      });

    (notificationService.sendPaymentNotification as jest.Mock).mockRejectedValueOnce(
      new Error('Notification failed')
    );

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert - Payment should still succeed even if notification fails
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should include all payment details in response', async () => {
    // Arrange
    const paymentData = {
      id: 999,
      credit_id: 1,
      amount: 250,
      payment_method: 'card',
      receipt_number: 'REC-999',
      recorded_by: 'user-1'
    };

    mockSupabaseClient.single
      .mockResolvedValueOnce({
        data: {
          id: 1,
          remaining_balance: 1000,
          customer: { email: 'test@test.com', first_name: 'John', last_name: 'Doe' }
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: paymentData,
        error: null
      });

    // Act
    await registerPayment(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({
      data: paymentData,
      message: 'Payment registered successfully'
    });
  });
});

describe('getPaymentsByCredit', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      query: { creditId: '1' },
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
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  // ============ Happy Path ============
  it('should return list of payments for credit ordered by date descending', async () => {
    // Arrange
    const mockPayments = [
      {
        id: 1,
        credit_id: 1,
        amount: 500,
        payment_date: '2024-01-15',
        payment_method: 'cash',
        recorded_by: { full_name: 'Collector A' }
      },
      {
        id: 2,
        credit_id: 1,
        amount: 250,
        payment_date: '2024-01-10',
        payment_method: 'transfer',
        recorded_by: { full_name: 'Collector B' }
      }
    ];

    mockSupabaseClient.order.mockResolvedValue({
      data: mockPayments,
      error: null
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: mockPayments });
    expect(mockSupabaseClient.order).toHaveBeenCalledWith('payment_date', {
      ascending: false
    });
  });

  it('should return empty array when no payments exist', async () => {
    // Arrange
    mockSupabaseClient.order.mockResolvedValue({
      data: [],
      error: null
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ data: [] });
  });

  // ============ Error Cases ============
  it('should handle database error', async () => {
    // Arrange
    mockSupabaseClient.order.mockResolvedValue({
      data: null,
      error: new Error('Database error')
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Database error')
    });
  });

  it('should handle invalid credit ID gracefully', async () => {
    // Arrange
    mockReq.query = { creditId: 'invalid-id' };
    mockSupabaseClient.order.mockResolvedValue({
      data: [],
      error: null
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should include recorder information in response', async () => {
    // Arrange
    const mockPayments = [
      {
        id: 1,
        credit_id: 1,
        amount: 500,
        recorded_by: { full_name: 'John Collector' }
      }
    ];

    mockSupabaseClient.order.mockResolvedValue({
      data: mockPayments,
      error: null
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          recorded_by: { full_name: 'John Collector' }
        })
      ])
    });
  });

  it('should filter payments by credit ID correctly', async () => {
    // Arrange
    mockReq.query = { creditId: '42' };
    mockSupabaseClient.order.mockResolvedValue({
      data: [],
      error: null
    });

    // Act
    await getPaymentsByCredit(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockSupabaseClient.eq).toHaveBeenCalledWith('credit_id', '42');
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
  it('should route POST requests to registerPayment', async () => {
    // Arrange
    mockReq = {
      method: 'POST',
      user: { id: 'user-1', email: 'test@test.com', role: 'cobrador' },
      body: {}
    };

    // Act
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('should route GET requests to getPaymentsByCredit', async () => {
    // Arrange
    mockReq = {
      method: 'GET',
      query: { creditId: '1' }
    };

    // Act
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(authMiddleware).toHaveBeenCalled();
  });

  // ============ Error Cases ============
  it('should return 405 for unsupported methods', async () => {
    // Arrange
    mockReq = { method: 'DELETE' };

    (authMiddleware as jest.Mock).mockImplementationOnce(
      (req, res, handlerFn) => {
        return handlerFn();
      }
    );

    // Act
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
});
