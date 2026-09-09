// TAREA 6: API Routes - Pagos

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { authMiddleware } from '@/middleware/auth';
import { sendPaymentNotification } from '@/services/notifications';

/**
 * POST /api/payments
 * Registrar nuevo pago
 */
export async function registerPayment(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const userId = req.user?.id;
    const { credit_id, amount, payment_method, receipt_number, notes } = req.body;

    if (!credit_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Obtener crédito
    const { data: credit, error: creditError } = await supabase
      .from('credits')
      .select('*, customer:customers(*)')
      .eq('id', credit_id)
      .single();

    if (creditError || !credit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    // Validar monto
    if (amount <= 0 || amount > credit.remaining_balance) {
      return res.status(400).json({
        error: 'Invalid payment amount',
        remaining: credit.remaining_balance
      });
    }

    // Insertar pago
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          credit_id,
          amount,
          payment_method,
          receipt_number,
          notes,
          recorded_by: userId
        }
      ])
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Trigger de audit se ejecuta automáticamente en BD
    // Trigger de update_credit_balance también

    // Enviar notificación por email
    await sendPaymentNotification({
      customer_email: credit.customer.email,
      customer_name: `${credit.customer.first_name} ${credit.customer.last_name}`,
      amount,
      remaining: credit.remaining_balance - amount,
      receipt_number
    });

    res.status(201).json({
      data: payment,
      message: 'Payment registered successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/payments/:creditId
 * Listar pagos de un crédito
 */
export async function getPaymentsByCredit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { creditId } = req.query;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        recorded_by:users(full_name)
      `)
      .eq('credit_id', creditId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return authMiddleware(req, res, async () => {
    switch (req.method) {
      case 'GET':
        return getPaymentsByCredit(req, res);
      case 'POST':
        return registerPayment(req, res);
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  });
}
