/* =========================================================
   routes/gallery.js — Public Gallery Endpoints
   GET /api/gallery          — list all active items (filter by category)
   GET /api/gallery/:id      — single item by ID
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// ── GET /api/gallery ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('gallery_items')
      .select('id, title, category, description, image_url, project_link, sort_order, created_at')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (category && category !== 'all') {
      query = query.ilike('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data.map(mapItem));
  } catch (err) {
    console.error('GET /gallery error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/gallery/:id ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Gallery item not found.' });
    }

    res.json(mapItem(data));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Mapper: DB row → API response ─────────────────────────────
function mapItem(row) {
  return {
    id:          row.id,
    title:       row.title,
    category:    row.category,
    description: row.description,
    imageUrl:    row.image_url,
    projectLink: row.project_link,
    sortOrder:   row.sort_order,
    createdAt:   row.created_at,
  };
}

export default router;
