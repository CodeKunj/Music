/* =========================================================
   middleware/auth.js — Admin JWT Authentication
   Verifies Supabase Auth JWT from the Authorization header.
   ========================================================= */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Use anon key here — we're just verifying the JWT, not bypassing RLS
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Express middleware that validates a Supabase Bearer JWT.
 * Attaches req.user = { id, email, ... } if valid.
 * Returns 401/403 otherwise.
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please log in again.',
    });
  }

  // Optional: restrict to a specific admin email
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && data.user.email !== adminEmail) {
    return res.status(403).json({
      success: false,
      error: 'You do not have admin access.',
    });
  }

  req.user = data.user;
  next();
}
