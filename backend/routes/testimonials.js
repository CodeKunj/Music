/* =========================================================
   routes/testimonials.js — Public Testimonials Endpoint
   GET /api/testimonials
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, role, quote, avatar_url, rating')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(
      data.map((t) => ({
        id:     t.id,
        name:   t.name,
        role:   t.role,
        quote:  t.quote,
        avatar: t.avatar_url,
        rating: t.rating,
      }))
    );
  } catch (err) {
    console.error('GET /testimonials error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
