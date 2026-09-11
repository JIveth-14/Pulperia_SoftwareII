// PaymentForm Component Tests
// Cobertura: Form submission, validation, error handling, payment methods, notifications

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from './PaymentForm';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('PaymentForm Component', () => {
  const mockRouter = {
    refresh: jest.fn()
  };

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
  });

  // ============ Happy Path - Rendering ============
  it('should render payment form with title', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
  });

  it('should render amount input field', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByLabelText('Monto a Pagar *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('should display max amount as hint text', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={5000} />);

    // Assert
    expect(screen.getByText(/Máximo: \$5(?:,|\s|\u00A0)000/)).toBeInTheDocument();
  });

  it('should render all payment method options', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByLabelText(/💵 Efectivo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/🏦 Transferencia/)).toBeInTheDocument();
    expect(screen.getByLabelText(/💳 Tarjeta/)).toBeInTheDocument();
    expect(screen.getByLabelText(/📋 Cheque/)).toBeInTheDocument();
  });

  it('should have cash as default payment method', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    const cashOption = screen.getByLabelText(/💵 Efectivo/) as HTMLInputElement;
    expect(cashOption.checked).toBe(true);
  });

  it('should render receipt number field', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByLabelText('Número de Recibo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej: REC-001')).toBeInTheDocument();
  });

  it('should render notes textarea', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByLabelText('Notas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Observaciones del pago...')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Assert
    expect(screen.getByRole('button', { name: /✅ Registrar Pago/ })).toBeInTheDocument();
  });

  // ============ Happy Path - Form Submission ============
  it('should submit payment with valid data', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} onSuccess={mockOnSuccess} />);

    const amountInput = screen.getByPlaceholderText('0.00');

    // Act
    await userEvent.type(amountInput, '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  it('should submit payment with all optional fields', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} onSuccess={mockOnSuccess} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByLabelText(/🏦 Transferencia/));
    await userEvent.type(screen.getByPlaceholderText('Ej: REC-001'), 'REC-12345');
    await userEvent.type(screen.getByPlaceholderText('Observaciones del pago...'), 'Payment note');

    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody).toEqual({
        credit_id: 1,
        amount: 500,
        payment_method: 'transfer',
        receipt_number: 'REC-12345',
        notes: 'Payment note'
      });
    });
  });

  it('should show success message after successful submission', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} onSuccess={mockOnSuccess} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('✅ Pago registrado exitosamente')).toBeInTheDocument();
    });
  });

  it('should call onSuccess callback after successful payment', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} onSuccess={mockOnSuccess} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('should refresh router after successful payment', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(
      () => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('should clear form fields after successful submission', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    const receiptInput = screen.getByPlaceholderText('Ej: REC-001') as HTMLInputElement;
    const notesInput = screen.getByPlaceholderText('Observaciones del pago...') as HTMLTextAreaElement;

    // Act
    await userEvent.type(amountInput, '500');
    await userEvent.type(receiptInput, 'REC-123');
    await userEvent.type(notesInput, 'Test notes');

    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(amountInput.value).toBe('');
      expect(receiptInput.value).toBe('');
      expect(notesInput.value).toBe('');
    });
  });

  // ============ Error Cases - Validation ============
  it('should reject empty amount', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    // Payment form has HTML5 validation, but also client-side
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('should reject zero amount', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    await userEvent.type(screen.getByPlaceholderText('0.00'), '0');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('El monto debe ser mayor a 0')).toBeInTheDocument();
    });
  });

  it('should reject negative amount', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    await userEvent.type(screen.getByPlaceholderText('0.00'), '-100');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('El monto debe ser mayor a 0')).toBeInTheDocument();
    });
  });

  it('should reject amount exceeding max', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    await userEvent.type(screen.getByPlaceholderText('0.00'), '1500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/El monto no puede exceder \$1(?:,|\s|\u00A0)000/)
      ).toBeInTheDocument();
    });
  });

  it('should reject non-numeric amount', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert - native number input should keep field invalid and prevent submission
    expect((amountInput as HTMLInputElement).validity.valid).toBe(false);
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ============ Error Cases - API Errors ============
  it('should display error message from API', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ error: 'Credit not found' })
    });

    render(<PaymentForm creditId={999} maxAmount={1000} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Credit not found')).toBeInTheDocument();
    });
  });

  it('should display generic error when API response is invalid', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({})
    });

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Error al registrar pago')).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  // ============ UI Behavior ============
  it('should show loading state during submission', async () => {
    // Arrange
    let resolveResponse: any;
    const promise = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    const submitButton = screen.getByRole('button', { name: /✅ Registrar Pago/ });
    fireEvent.click(submitButton);

    // Assert - Button should show loading text
    await waitFor(() => {
      expect(screen.getByText(/⏳ Procesando/)).toBeInTheDocument();
    });

    // Resolve the promise
    resolveResponse({ ok: true, json: jest.fn().mockResolvedValueOnce({ success: true }) });

    // Verify loading state is gone
    await waitFor(() => {
      expect(screen.queryByText(/⏳ Procesando/)).not.toBeInTheDocument();
    });
  });

  it('should disable submit button during submission', async () => {
    // Arrange
    let resolveResponse: any;
    const promise = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    const submitButton = screen.getByRole('button', {
      name: /✅ Registrar Pago/
    }) as HTMLButtonElement;

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(submitButton.disabled).toBe(true);
    });

    resolveResponse({ ok: true, json: jest.fn().mockResolvedValueOnce({ success: true }) });

    await waitFor(() => {
      expect(submitButton.disabled).toBe(false);
    });
  });

  it('should clear error message on new submission attempt', async () => {
    // Arrange
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({ error: 'First error' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ success: true })
      });

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act - First submission with error
    await userEvent.type(screen.getByPlaceholderText('0.00'), '100');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Clear and try again
    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert - Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('✅ Pago registrado exitosamente')).toBeInTheDocument();
    });
  });

  // ============ Payment Methods ============
  it('should allow switching between payment methods', async () => {
    // Act
    render(<PaymentForm creditId={1} maxAmount={1000} />);

    const transferOption = screen.getByLabelText(/🏦 Transferencia/) as HTMLInputElement;
    fireEvent.click(transferOption);

    // Assert
    expect(transferOption.checked).toBe(true);
  });

  it('should include selected payment method in submission', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000} />);

    // Act
    fireEvent.click(screen.getByLabelText(/💳 Tarjeta/));
    await userEvent.type(screen.getByPlaceholderText('0.00'), '500');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody.payment_method).toBe('card');
    });
  });

  // ============ Decimal Amounts ============
  it('should handle decimal amounts correctly', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    render(<PaymentForm creditId={1} maxAmount={1000.99} />);

    // Act
    await userEvent.type(screen.getByPlaceholderText('0.00'), '123.45');
    fireEvent.click(screen.getByRole('button', { name: /✅ Registrar Pago/ }));

    // Assert
    await waitFor(() => {
      const callBody = JSON.parse(
        (global.fetch as jest.Mock).mock.calls[0][1].body
      );
      expect(callBody.amount).toBe(123.45);
    });
  });
});
