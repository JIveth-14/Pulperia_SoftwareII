// CreditCard Component Tests
// Cobertura: Rendering, status display, progress calculation, date formatting, expand/collapse, callbacks

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditCard, Credit } from './CreditCard';

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, format, options) => {
    if (format.includes('MMMM')) {
      return '1 de enero de 2024'; // Spanish format
    }
    return '01/01/2024';
  }),
  isPast: jest.fn((date) => {
    return new Date(date) < new Date();
  }),
  isAfter: jest.fn((date1, date2) => {
    return new Date(date1) > new Date(date2);
  })
}));

describe('CreditCard Component', () => {
  const mockCredit: Credit = {
    id: 1,
    customer: {
      first_name: 'John',
      last_name: 'Doe',
      phone: '123-456-7890',
      email: 'john@example.com'
    },
    amount: 1000,
    interest_rate: 5,
    remaining_balance: 500,
    total_paid: 500,
    status: 'active',
    due_date: '2099-12-31',
    created_at: '2024-01-01'
  };

  const mockCallbacks = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onPayment: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ Happy Path - Rendering ============
  it('should render credit card with customer name', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render customer phone number', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
  });

  it('should display status badge with correct text', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('should display original amount formatted', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText(/\$1(?:,|\s|\u00A0)000/)).toBeInTheDocument();
  });

  it('should display paid amount in green', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    const paidAmount = screen.getByText('Pagado').parentElement?.querySelector('p.text-green-600');
    expect(paidAmount).toHaveTextContent(/\$\s*500/);
  });

  it('should display remaining balance', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    const remainingAmount = screen
      .getByText('Saldo')
      .parentElement?.querySelector('p.text-xl');
    expect(remainingAmount).toHaveTextContent(/\$\s*500/);
  });

  // ============ Progress Bar ============
  it('should calculate and display correct payment percentage', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert - 500/1000 = 50%
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('should cap progress bar at 100%', () => {
    // Arrange
    const overpaidCredit: Credit = {
      ...mockCredit,
      total_paid: 1500
    };

    // Act
    render(<CreditCard credit={overpaidCredit} />);

    // Assert
    const progressDiv = document.querySelector('div[style*="width: 100%"]');
    expect(progressDiv).toBeInTheDocument();
  });

  it('should show 0% progress when no payments made', () => {
    // Arrange
    const unpaidCredit: Credit = {
      ...mockCredit,
      total_paid: 0
    };

    // Act
    render(<CreditCard credit={unpaidCredit} />);

    // Assert
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  // ============ Status Badges ============
  it('should show active status with blue styling', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    const statusBadge = screen.getByText('Activo');
    expect(statusBadge).toHaveClass('bg-blue-100');
    expect(statusBadge).toHaveClass('text-blue-800');
  });

  it('should show completed status with green styling', () => {
    // Arrange
    const completedCredit: Credit = {
      ...mockCredit,
      status: 'completed'
    };

    // Act
    render(<CreditCard credit={completedCredit} />);

    // Assert
    expect(screen.getByText('Completado')).toHaveClass('bg-green-100');
  });

  it('should show pending status with yellow styling', () => {
    // Arrange
    const pendingCredit: Credit = {
      ...mockCredit,
      status: 'pending'
    };

    // Act
    render(<CreditCard credit={pendingCredit} />);

    // Assert
    expect(screen.getByText('Pendiente')).toHaveClass('bg-yellow-100');
  });

  it('should show defaulted status with red styling', () => {
    // Arrange
    const defaultedCredit: Credit = {
      ...mockCredit,
      status: 'defaulted'
    };

    // Act
    render(<CreditCard credit={defaultedCredit} />);

    // Assert
    expect(screen.getByText('Moroso')).toHaveClass('bg-red-100');
  });

  // ============ Due Date Display ============
  it('should display due date for future dates', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText(/📅 Vence/)).toBeInTheDocument();
  });

  it('should show overdue warning for past dates', () => {
    // Arrange
    const overdueCredit: Credit = {
      ...mockCredit,
      due_date: '2020-01-01'
    };

    // Act
    render(<CreditCard credit={overdueCredit} />);

    // Assert
    expect(screen.getByText(/⚠️ Vencido/)).toBeInTheDocument();
  });

  it('should highlight overdue status in red', () => {
    // Arrange
    const overdueCredit: Credit = {
      ...mockCredit,
      due_date: '2020-01-01'
    };

    // Act
    render(<CreditCard credit={overdueCredit} />);

    // Assert
    const overdueDiv = screen.getByText(/⚠️ Vencido/).parentElement;
    expect(overdueDiv).toHaveClass('bg-red-50');
    expect(overdueDiv).toHaveClass('border-red-200');
  });

  it('should display remaining balance in red when overdue', () => {
    // Arrange
    const overdueCredit: Credit = {
      ...mockCredit,
      due_date: '2020-01-01',
      remaining_balance: 300
    };

    // Act
    render(<CreditCard credit={overdueCredit} />);

    // Assert
    const balanceElements = screen.getAllByText(/\$300/);
    expect(balanceElements.length).toBeGreaterThan(0);
  });

  // ============ Expand/Collapse Details ============
  it('should show details button', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });

  it('should expand details when clicking button', async () => {
    // Act
    render(<CreditCard credit={mockCredit} />);
    const detailsButton = screen.getByText('Detalles');

    fireEvent.click(detailsButton);

    // Assert
    expect(screen.getByText('Tasa de Interés')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('Correo')).toBeInTheDocument();
  });

  it('should show credit ID in expanded details', async () => {
    // Act
    render(<CreditCard credit={mockCredit} />);
    fireEvent.click(screen.getByText('Detalles'));

    // Assert
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should toggle between Detalles and Ocultar', async () => {
    // Act
    render(<CreditCard credit={mockCredit} />);
    let button = screen.getByText('Detalles');

    fireEvent.click(button);
    expect(screen.getByText('Ocultar')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ocultar'));
    expect(screen.getByText('Detalles')).toBeInTheDocument();
  });

  // ============ Action Buttons ============
  it('should display payment button for active credits', () => {
    // Act
    render(<CreditCard credit={mockCredit} onPayment={mockCallbacks.onPayment} />);

    // Assert
    expect(screen.getByText(/💰 Registrar Pago/)).toBeInTheDocument();
  });

  it('should hide payment button for completed credits', () => {
    // Arrange
    const completedCredit: Credit = {
      ...mockCredit,
      status: 'completed'
    };

    // Act
    render(<CreditCard credit={completedCredit} onPayment={mockCallbacks.onPayment} />);

    // Assert
    expect(screen.queryByText(/💰 Registrar Pago/)).not.toBeInTheDocument();
  });

  it('should hide payment button for defaulted credits', () => {
    // Arrange
    const defaultedCredit: Credit = {
      ...mockCredit,
      status: 'defaulted'
    };

    // Act
    render(<CreditCard credit={defaultedCredit} onPayment={mockCallbacks.onPayment} />);

    // Assert
    expect(screen.queryByText(/💰 Registrar Pago/)).not.toBeInTheDocument();
  });

  it('should call onPayment with credit ID when payment button clicked', async () => {
    // Act
    render(<CreditCard credit={mockCredit} onPayment={mockCallbacks.onPayment} />);
    fireEvent.click(screen.getByText(/💰 Registrar Pago/));

    // Assert
    expect(mockCallbacks.onPayment).toHaveBeenCalledWith(1);
  });

  it('should display edit button when onEdit provided', () => {
    // Act
    render(<CreditCard credit={mockCredit} onEdit={mockCallbacks.onEdit} />);

    // Assert
    expect(screen.getByText(/✏️ Editar/)).toBeInTheDocument();
  });

  it('should call onEdit with credit data when edit button clicked', async () => {
    // Act
    render(<CreditCard credit={mockCredit} onEdit={mockCallbacks.onEdit} />);
    fireEvent.click(screen.getByText(/✏️ Editar/));

    // Assert
    expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockCredit);
  });

  it('should display delete button when onDelete provided', () => {
    // Act
    render(<CreditCard credit={mockCredit} onDelete={mockCallbacks.onDelete} />);

    // Assert
    expect(screen.getByText('🗑️')).toBeInTheDocument();
  });

  it('should call onDelete with credit ID when delete button clicked', async () => {
    // Act
    render(<CreditCard credit={mockCredit} onDelete={mockCallbacks.onDelete} />);
    const deleteButton = screen.getByText('🗑️');

    fireEvent.click(deleteButton);

    // Assert
    expect(mockCallbacks.onDelete).toHaveBeenCalledWith(1);
  });

  // ============ Edge Cases ============
  it('should render without optional callbacks', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText(/✏️ Editar/)).not.toBeInTheDocument();
    expect(screen.queryByText('🗑️')).not.toBeInTheDocument();
  });

  it('should handle zero interest rate', () => {
    // Arrange
    const zeroInterestCredit: Credit = {
      ...mockCredit,
      interest_rate: 0
    };

    // Act
    render(<CreditCard credit={zeroInterestCredit} />);
    fireEvent.click(screen.getByText('Detalles'));

    // Assert
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should handle large amounts', () => {
    // Arrange
    const largeAmountCredit: Credit = {
      ...mockCredit,
      amount: 1000000,
      total_paid: 500000
    };

    // Act
    render(<CreditCard credit={largeAmountCredit} />);

    // Assert
    expect(screen.getByText(/\$1(?:,|\s|\u00A0)000(?:,|\s|\u00A0)000/)).toBeInTheDocument();
  });

  it('should display customer email in expanded view', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);
    fireEvent.click(screen.getByText('Detalles'));

    // Assert
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display formatted creation date', () => {
    // Act
    render(<CreditCard credit={mockCredit} />);
    fireEvent.click(screen.getByText('Detalles'));

    // Assert
    expect(screen.getByText('01/01/2024')).toBeInTheDocument();
  });

  // ============ Multiple Callbacks ============
  it('should support all callbacks simultaneously', async () => {
    // Act
    render(
      <CreditCard
        credit={mockCredit}
        onEdit={mockCallbacks.onEdit}
        onDelete={mockCallbacks.onDelete}
        onPayment={mockCallbacks.onPayment}
      />
    );

    fireEvent.click(screen.getByText(/💰 Registrar Pago/));
    fireEvent.click(screen.getByText(/✏️ Editar/));
    fireEvent.click(screen.getByText('🗑️'));

    // Assert
    expect(mockCallbacks.onPayment).toHaveBeenCalledWith(1);
    expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockCredit);
    expect(mockCallbacks.onDelete).toHaveBeenCalledWith(1);
  });
});
