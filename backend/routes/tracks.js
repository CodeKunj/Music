/* =========================================================
   routes/tracks.js — Public Track Endpoints
   GET /api/tracks          — list all (filter by genre, search)
   GET /api/tracks/featured — single featured track
   GET /api/tracks/:id      — single track by ID
   POST /api/tracks/:id/play — increment play count
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// ── GET /api/tracks ────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { genre, q, limit = 100, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('tracks')
      .select('id, title, artist, genre, cover_url, audio_url, duration, description, is_featured, play_count, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (genre && genre !== 'all') {
      query = query.ilike('genre', genre);
    }

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,artist.ilike.%${q}%,genre.ilike.%${q}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    // Map DB columns to frontend-expected shape
    res.json(data.map(mapTrack));
  } catch (err) {
    console.error('GET /tracks error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/tracks/featured ───────────────────────────────────
router.get('/featured', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_featured', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    if (!data) {
      // Fall back to latest track
      const { data: latest, error: e2 } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (e2) return res.status(404).json({ success: false, error: 'No tracks found.' });
      return res.json(mapTrack(latest));
    }

    res.json(mapTrack(data));
  } catch (err) {
    console.error('GET /tracks/featured error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/tracks/:id ────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Track not found.' });
    }

    res.json(mapTrack(data));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/tracks/:id/play ──────────────────────────────────
router.post('/:id/play', async (req, res) => {
  try {
    const { error } = await supabase.rpc('increment_play_count', {
      track_id: req.params.id,
    }).catch(() => ({ error: null })); // Ignore if RPC doesn't exist

    // Fallback: direct update
    if (error) {
      await supabase
        .from('tracks')
        .update({ play_count: supabase.sql`play_count + 1` })
        .eq('id', req.params.id);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Mapper: DB row → API response ─────────────────────────────
function mapTrack(row) {
  return {
    id:          row.id,
    title:       row.title,
    artist:      row.artist,
    genre:       row.genre,
    cover:       row.cover_url,
    audio:       row.audio_url,
    duration:    row.duration,
    description: row.description,
    isFeatured:  row.is_featured,
    plays:       row.play_count,
    createdAt:   row.created_at,
  };
}

export default router;
