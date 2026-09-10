// TAREA 7: Auth Middleware + Security

import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { jwtDecode } from 'jwt-decode';

/**
 * Middleware de Autenticación
 * Valida JWT desde cookies HttpOnly
 */
export async function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: () => Promise<void> | void
) {
  try {
    // 1. Obtener JWT de cookies
    const token = req.cookies.sb_access_token;

    if (!token) {
      return res.status(401).json({ error: 'No authentication token' });
    }

    // 2. Validar JWT con Supabase
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 3. Obtener datos del usuario (role, etc)
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', data.user.id)
      .single();

    // 4. Adjuntar usuario a request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: userProfile?.role || 'cliente',
      full_name: userProfile?.full_name
    };

    // 5. Continuar con el handler
    return handler();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware para requerir rol específico
 */
export function requireRole(role: 'admin' | 'cobrador' | 'cliente') {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    handler: () => Promise<void> | void
  ) => {
    await authMiddleware(req, res, () => {
      if (req.user?.role !== role && req.user?.role !== 'admin') {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: role
        });
      }
      return handler();
    });
  };
}

/**
 * Middleware de Rate Limiting
 */
const requestCounts = new Map<string, number[]>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar requests antiguos
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, []);
    }

    const timestamps = requestCounts.get(userId)!;
    const validTimestamps = timestamps.filter(ts => ts > windowStart);

    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((validTimestamps[0] + windowMs - now) / 1000)
      });
    }

    validTimestamps.push(now);
    requestCounts.set(userId, validTimestamps);

    next();
  };
}

/**
 * Middleware de validación de CORS
 */
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://mora.app'
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Middleware de seguridad de headers
 */
export function securityHeaders(req: NextApiRequest, res: NextApiResponse) {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // CSP (Content Security Policy)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
}

/**
 * Validador de entrada (sanitize)
 */
export function validateInput(data: any, schema: Record<string, string>) {
  const errors: Record<string, string> = {};

  for (const [field, type] of Object.entries(schema)) {
    const value = data[field];

    if (type === 'email') {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field] = `Invalid ${field}`;
      }
    } else if (type === 'number') {
      if (!value || isNaN(Number(value))) {
        errors[field] = `${field} must be a number`;
      }
    } else if (type === 'string') {
      if (!value || typeof value !== 'string') {
        errors[field] = `${field} is required`;
      }
    } else if (type === 'phone') {
      if (!value || !/^\+?[\d\s\-()]+$/.test(value)) {
        errors[field] = `Invalid phone number`;
      }
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

// Extend NextApiRequest para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'cobrador' | 'cliente';
        full_name?: string;
      };
    }
  }
}

// También para Next.js
declare module 'next' {
  namespace NextApiRequest {
    interface NextApiRequest {
      user?: {
        id: string;
        email: string;
        role: 'admin' | 'cobrador' | 'cliente';
        full_name?: string;
      };
    }
  }
}
