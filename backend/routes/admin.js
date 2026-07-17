/* =========================================================
   routes/admin.js — Protected Admin CRUD Routes
   All routes require a valid Supabase Auth JWT (requireAdmin).
   ========================================================= */

import { Router } from 'express';
import { requireAdmin }          from '../middleware/auth.js';
import { upload, trackFields, baFields } from '../middleware/upload.js';
import {
  supabase,
  uploadFile,
  deleteFile,
  sanitizeFilename,
} from '../lib/supabase.js';

const router = Router();

// Apply auth to ALL admin routes
router.use(requireAdmin);

// ── STATS ─────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const [
      { count: totalTracks },
      { count: unreadContacts },
      { data: playData },
      { data: artistData },
    ] = await Promise.all([
      supabase.from('tracks').select('*', { count: 'exact', head: true }),
      supabase.from('contact_submissions').select('*', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('tracks').select('play_count'),
      supabase.from('tracks').select('artist'),
    ]);

    const totalPlays   = (playData  || []).reduce((sum, t) => sum + (t.play_count || 0), 0);
    const uniqueArtists = new Set((artistData || []).map((t) => t.artist)).size;

    res.json({
      totalTracks:    totalTracks  || 0,
      totalPlays,
      uniqueArtists,
      unreadContacts: unreadContacts || 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  TRACKS
// ══════════════════════════════════════════════════════════════

// GET /api/admin/tracks — list all (with full metadata)
router.get('/tracks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/tracks — upload new track
router.post('/tracks', upload.fields(trackFields), async (req, res) => {
  try {
    const { title, artist, genre, duration, description, is_featured } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required.' });
    }

    const files = req.files || {};
    const ts = Date.now();

    // Upload audio file
    let audio_url = null;
    if (files.audio?.[0]) {
      const f = files.audio[0];
      const name = `tracks/${ts}_${sanitizeFilename(f.originalname)}`;
      audio_url = await uploadFile('audio', name, f.buffer, f.mimetype);
    }

    // Upload cover image
    let cover_url = null;
    if (files.cover?.[0]) {
      const f = files.cover[0];
      const name = `tracks/${ts}_${sanitizeFilename(f.originalname)}`;
      cover_url = await uploadFile('covers', name, f.buffer, f.mimetype);
    }

    // If is_featured=true, unset other featured tracks first
    if (is_featured === 'true' || is_featured === true) {
      await supabase.from('tracks').update({ is_featured: false }).eq('is_featured', true);
    }

    const { data, error } = await supabase
      .from('tracks')
      .insert({
        title:       title.trim(),
        artist:      (artist || 'Kunj Rana').trim(),
        genre:       genre?.trim() || null,
        duration:    duration?.trim() || null,
        description: description?.trim() || null,
        cover_url,
        audio_url,
        is_featured: is_featured === 'true' || is_featured === true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('POST /admin/tracks error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/tracks/:id — update track
router.put('/tracks/:id', upload.fields(trackFields), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, genre, duration, description, is_featured } = req.body;

    // Fetch existing record
    const { data: existing, error: fetchErr } = await supabase
      .from('tracks')
      .select('cover_url, audio_url')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Track not found.' });
    }

    const files = req.files || {};
    const ts    = Date.now();
    const updates = {};

    if (title)  updates.title  = title.trim();
    if (artist) updates.artist = artist.trim();
    if (genre !== undefined)  updates.genre       = genre?.trim()       || null;
    if (duration !== undefined) updates.duration  = duration?.trim()    || null;
    if (description !== undefined) updates.description = description?.trim() || null;

    // Replace audio if new file uploaded
    if (files.audio?.[0]) {
      const f = files.audio[0];
      await deleteFile('audio', existing.audio_url);
      const name = `tracks/${ts}_${sanitizeFilename(f.originalname)}`;
      updates.audio_url = await uploadFile('audio', name, f.buffer, f.mimetype);
    }

    // Replace cover if new file uploaded
    if (files.cover?.[0]) {
      const f = files.cover[0];
      await deleteFile('covers', existing.cover_url);
      const name = `tracks/${ts}_${sanitizeFilename(f.originalname)}`;
      updates.cover_url = await uploadFile('covers', name, f.buffer, f.mimetype);
    }

    // Handle featured flag
    if (is_featured !== undefined) {
      const val = is_featured === 'true' || is_featured === true;
      if (val) {
        await supabase.from('tracks').update({ is_featured: false }).eq('is_featured', true);
      }
      updates.is_featured = val;
    }

    const { data, error } = await supabase
      .from('tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('PUT /admin/tracks error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/tracks/:id
router.delete('/tracks/:id', async (req, res) => {
  try {
    const { data: track, error: fetchErr } = await supabase
      .from('tracks')
      .select('cover_url, audio_url')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !track) {
      return res.status(404).json({ success: false, error: 'Track not found.' });
    }

    // Delete storage files
    await Promise.all([
      deleteFile('audio',  track.audio_url),
      deleteFile('covers', track.cover_url),
    ]);

    const { error } = await supabase.from('tracks').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ success: true, message: 'Track deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
//  SERVICES
// ══════════════════════════════════════════════════════════════

router.get('/services', async (_req, res) => {
  const { data, error } = await supabase
    .from('services').select('*').order('sort_order');
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json(data);
});

router.post('/services', async (req, res) => {
  const { name, description, icon, features, sort_order } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Name required.' });

  const { data, error } = await supabase
    .from('services')
    .insert({ name, description, icon, features: features || [], sort_order: sort_order || 0 })
    .select().single();

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
});

router.put('/services/:id', async (req, res) => {
  const allowed = ['name','description','icon','features','sort_order'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const { data, error } = await supabase
    .from('services').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.delete('/services/:id', async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  TESTIMONIALS
// ══════════════════════════════════════════════════════════════

router.get('/testimonials', async (_req, res) => {
  const { data, error } = await supabase
    .from('testimonials').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json(data);
});

router.post('/testimonials', upload.single('avatar'), async (req, res) => {
  try {
    const { name, role, quote, rating, is_active } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name required.' });

    let avatar_url = null;
    if (req.file) {
      const fname = `avatars/${Date.now()}_${sanitizeFilename(req.file.originalname)}`;
      avatar_url = await uploadFile('avatars', fname, req.file.buffer, req.file.mimetype);
    }

    const { data, error } = await supabase
      .from('testimonials')
      .insert({ name, role, quote, avatar_url, rating: parseInt(rating) || 5,
                is_active: is_active !== 'false' })
      .select().single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/testimonials/:id', upload.single('avatar'), async (req, res) => {
  try {
    const { name, role, quote, rating, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (quote !== undefined) updates.quote = quote;
    if (rating !== undefined) updates.rating = parseInt(rating);
    if (is_active !== undefined) updates.is_active = is_active !== 'false';

    if (req.file) {
      const { data: existing } = await supabase
        .from('testimonials').select('avatar_url').eq('id', req.params.id).single();
      if (existing?.avatar_url) await deleteFile('avatars', existing.avatar_url);
      const fname = `avatars/${Date.now()}_${sanitizeFilename(req.file.originalname)}`;
      updates.avatar_url = await uploadFile('avatars', fname, req.file.buffer, req.file.mimetype);
    }

    const { data, error } = await supabase
      .from('testimonials').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  const { data } = await supabase
    .from('testimonials').select('avatar_url').eq('id', req.params.id).single();
  if (data?.avatar_url) await deleteFile('avatars', data.avatar_url);
  const { error } = await supabase.from('testimonials').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  BEFORE / AFTER PROJECTS
// ══════════════════════════════════════════════════════════════

router.get('/before-after', async (_req, res) => {
  const { data, error } = await supabase
    .from('before_after_projects').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json(data);
});

router.post('/before-after', upload.fields(baFields), async (req, res) => {
  try {
    const { project_name, artist } = req.body;
    if (!project_name) return res.status(400).json({ success: false, error: 'Project name required.' });

    const files = req.files || {};
    const ts = Date.now();
    let before_audio_url = null, after_audio_url = null;

    if (files.before?.[0]) {
      const f = files.before[0];
      before_audio_url = await uploadFile('audio', `ba/${ts}_before_${sanitizeFilename(f.originalname)}`, f.buffer, f.mimetype);
    }
    if (files.after?.[0]) {
      const f = files.after[0];
      after_audio_url = await uploadFile('audio', `ba/${ts}_after_${sanitizeFilename(f.originalname)}`, f.buffer, f.mimetype);
    }

    const { data, error } = await supabase
      .from('before_after_projects')
      .insert({ project_name, artist, before_audio_url, after_audio_url })
      .select().single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/before-after/:id', upload.fields(baFields), async (req, res) => {
  try {
    const { project_name, artist } = req.body;
    const updates = {};
    if (project_name) updates.project_name = project_name;
    if (artist !== undefined) updates.artist = artist;

    const files = req.files || {};
    const ts = Date.now();

    if (files.before?.[0]) {
      const f = files.before[0];
      updates.before_audio_url = await uploadFile(
        'audio', `ba/${ts}_before_${sanitizeFilename(f.originalname)}`, f.buffer, f.mimetype
      );
    }
    if (files.after?.[0]) {
      const f = files.after[0];
      updates.after_audio_url = await uploadFile(
        'audio', `ba/${ts}_after_${sanitizeFilename(f.originalname)}`, f.buffer, f.mimetype
      );
    }

    const { data, error } = await supabase
      .from('before_after_projects').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/before-after/:id', async (req, res) => {
  const { data } = await supabase
    .from('before_after_projects').select('before_audio_url,after_audio_url').eq('id', req.params.id).single();
  if (data) {
    await Promise.all([
      deleteFile('audio', data.before_audio_url),
      deleteFile('audio', data.after_audio_url),
    ]);
  }
  const { error } = await supabase.from('before_after_projects').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════
//  CONTACT SUBMISSIONS
// ══════════════════════════════════════════════════════════════

router.get('/contacts', async (req, res) => {
  const { unread } = req.query;
  let query = supabase.from('contact_submissions').select('*').order('created_at', { ascending: false });
  if (unread === 'true') query = query.eq('is_read', false);
  const { data, error } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json(data);
});

router.patch('/contacts/:id', async (req, res) => {
  const { is_read } = req.body;
  const { data, error } = await supabase
    .from('contact_submissions')
    .update({ is_read: Boolean(is_read) })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, data });
});

router.delete('/contacts/:id', async (req, res) => {
  const { error } = await supabase.from('contact_submissions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

export default router;
