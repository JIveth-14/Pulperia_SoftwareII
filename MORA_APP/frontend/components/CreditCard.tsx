// TAREA 8: Frontend Components

'use client';

import { FC, useState } from 'react';
import { format, isAfter, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

export interface Credit {
  id: number;
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  amount: number;
  interest_rate: number;
  remaining_balance: number;
  total_paid: number;
  status: 'active' | 'pending' | 'completed' | 'defaulted';
  due_date: string;
  created_at: string;
}

interface CreditCardProps {
  credit: Credit;
  onEdit?: (credit: Credit) => void;
  onDelete?: (id: number) => void;
  onPayment?: (id: number) => void;
}

export const CreditCard: FC<CreditCardProps> = ({
  credit,
  onEdit,
  onDelete,
  onPayment
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const percentagePaid = (credit.total_paid / credit.amount) * 100;
  const isOverdue = credit.due_date && isPast(new Date(credit.due_date));
  const isCompleted = credit.status === 'completed';
  const isDefaulted = credit.status === 'defaulted';

  const statusColor = {
    active: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    defaulted: 'bg-red-100 text-red-800'
  };

  const statusLabel = {
    active: 'Activo',
    pending: 'Pendiente',
    completed: 'Completado',
    defaulted: 'Moroso'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {credit.customer.first_name} {credit.customer.last_name}
          </h3>
          <p className="text-sm text-gray-600">{credit.customer.phone}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[credit.status]}`}>
          {statusLabel[credit.status]}
        </span>
      </div>

      {/* Información Principal */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Monto Original</p>
          <p className="text-xl font-bold text-gray-900">
            ${credit.amount.toLocaleString('es-CR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Pagado</p>
          <p className="text-xl font-bold text-green-600">
            ${credit.total_paid.toLocaleString('es-CR')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Saldo</p>
          <p className={`text-xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            ${credit.remaining_balance.toLocaleString('es-CR')}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progreso de Pago</span>
          <span className="text-sm font-semibold text-gray-900">{percentagePaid.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentagePaid, 100)}%` }}
          />
        </div>
      </div>

      {/* Fecha de Vencimiento */}
      {credit.due_date && (
        <div className={`mb-4 p-3 rounded-md ${
          isOverdue
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className="text-sm font-medium text-gray-900">
            {isOverdue ? '⚠️ Vencido' : '📅 Vence'}: {' '}
            {format(new Date(credit.due_date), 'd \'de\' MMMM \'de\' yyyy', { locale: es })}
          </p>
        </div>
      )}

      {/* Detalles Expandibles */}
      {isExpanded && (
        <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600 font-medium">Tasa de Interés</dt>
              <dd className="text-gray-900 font-semibold">{credit.interest_rate}%</dd>
            </div>
            <div>
              <dt className="text-gray-600 font-medium">Correo</dt>
              <dd className="text-gray-900">{credit.customer.email}</dd>
            </div>
            <div>
              <dt className="text-gray-600 font-medium">Creado</dt>
              <dd className="text-gray-900">
                {format(new Date(credit.created_at), 'd/MM/yyyy', { locale: es })}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 font-medium">ID de Crédito</dt>
              <dd className="text-gray-900 font-mono">{credit.id}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          {isExpanded ? 'Ocultar' : 'Detalles'}
        </button>

        {!isCompleted && !isDefaulted && onPayment && (
          <button
            onClick={() => onPayment(credit.id)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            💰 Registrar Pago
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(credit)}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            ✏️ Editar
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(credit.id)}
            className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default CreditCard;
