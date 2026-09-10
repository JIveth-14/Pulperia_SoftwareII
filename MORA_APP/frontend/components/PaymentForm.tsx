// TAREA 8: Payment Form Component

'use client';

import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentFormProps {
  creditId: number;
  maxAmount: number;
  onSuccess?: () => void;
}

export const PaymentForm: FC<PaymentFormProps> = ({
  creditId,
  maxAmount,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'card' | 'check'>('cash');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const parsedAmount = Number.parseFloat(amount);

      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('El monto debe ser mayor a 0');
        setIsLoading(false);
        return;
      }

      if (parsedAmount > maxAmount) {
        setError(`El monto no puede exceder $${maxAmount.toLocaleString('es-CR')}`);
        setIsLoading(false);
        return;
      }

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credit_id: creditId,
          amount: parsedAmount,
          payment_method: paymentMethod,
          receipt_number: receiptNumber || null,
          notes: notes || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al registrar pago');
        setIsLoading(false);
        return;
      }

      setSuccess('✅ Pago registrado exitosamente');
      setAmount('');
      setNotes('');
      setReceiptNumber('');

      setTimeout(() => {
        onSuccess?.();
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al procesar pago');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Registrar Pago</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Monto */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Monto a Pagar *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-600 font-semibold">$</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Máximo: ${maxAmount.toLocaleString('es-CR')}
          </p>
        </div>

        {/* Método de Pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pago *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['cash', 'transfer', 'card', 'check'].map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">
                  {method === 'cash' && '💵 Efectivo'}
                  {method === 'transfer' && '🏦 Transferencia'}
                  {method === 'card' && '💳 Tarjeta'}
                  {method === 'check' && '📋 Cheque'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Número de Recibo */}
        <div>
          <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Número de Recibo
          </label>
          <input
            id="receiptNumber"
            type="text"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder="Ej: REC-001"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Notas */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones del pago..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white font-medium py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {isLoading ? '⏳ Procesando...' : '✅ Registrar Pago'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
