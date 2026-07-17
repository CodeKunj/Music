/* =========================================================
   routes/services.js — Public Services Endpoint
   GET /api/services
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, icon, features, sort_order')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json(
      data.map((s) => ({
        id:          s.id,
        name:        s.name,
        description: s.description,
        icon:        s.icon,
        features:    Array.isArray(s.features) ? s.features : JSON.parse(s.features || '[]'),
        sortOrder:   s.sort_order,
      }))
    );
  } catch (err) {
    console.error('GET /services error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
