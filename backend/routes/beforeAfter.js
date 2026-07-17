/* =========================================================
   routes/beforeAfter.js — Public Before/After Endpoint
   GET /api/before-after
   ========================================================= */

import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('before_after_projects')
      .select('id, project_name, artist, before_audio_url, after_audio_url, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(
      data.map((p) => ({
        id:           p.id,
        projectName:  p.project_name,
        artist:       p.artist,
        beforeAudio:  p.before_audio_url,
        afterAudio:   p.after_audio_url,
      }))
    );
  } catch (err) {
    console.error('GET /before-after error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
