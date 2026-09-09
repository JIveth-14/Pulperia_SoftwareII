// TAREA 6: API Routes + Endpoints

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { authMiddleware } from '@/middleware/auth';

/**
 * GET /api/credits
 * Listar créditos del usuario (filtrado por RLS)
 */
export async function getCredits(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Validar autenticación
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Obtener créditos (RLS filtra automáticamente)
    const { data, error } = await supabase
      .from('credits')
      .select(`
        id,
        amount,
        interest_rate,
        remaining_balance,
        status,
        due_date,
        created_at,
        customer:customers(
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        created_by:users!credits_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/credits
 * Crear nuevo crédito (solo admin)
 */
export async function createCredit(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Solo admins pueden crear créditos
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { customer_id, amount, interest_rate, due_date, notes } = req.body;

    // Validar input
    if (!customer_id || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('credits')
      .insert([
        {
          customer_id,
          amount,
          interest_rate: interest_rate || 0,
          remaining_balance: amount + (amount * (interest_rate || 0) / 100),
          due_date,
          notes,
          created_by: userId
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Log en audit
    await supabase
      .from('audit_log')
      .insert([{
        user_id: userId,
        action: 'CREATE',
        table_name: 'credits',
        record_id: data.id.toString(),
        new_values: data
      }]);

    res.status(201).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/credits/:id
 * Obtener detalles de un crédito
 */
export async function getCreditById(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabase
      .from('credits')
      .select(`
        *,
        customer:customers(*),
        payments:payments(*),
        assignments:assignments(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/credits/:id
 * Actualizar crédito (solo admin)
 */
export async function updateCredit(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { status, notes } = req.body;

    const { data, error } = await supabase
      .from('credits')
      .update({ status, notes })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/credits/:id
 * Eliminar crédito (solo admin)
 */
export async function deleteCredit(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
      .from('credits')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================
// HANDLER Principal (para Next.js)
// ============================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Aplicar middleware de auth
  return authMiddleware(req, res, async () => {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          return getCreditById(req, res);
        }
        return getCredits(req, res);
      case 'POST':
        return createCredit(req, res);
      case 'PUT':
        return updateCredit(req, res);
      case 'DELETE':
        return deleteCredit(req, res);
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  });
}
