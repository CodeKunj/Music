/* =========================================================
   middleware/upload.js — Multer Configuration
   Uses memoryStorage: files go directly to Supabase, 
   nothing written to disk.
   ========================================================= */

import multer from 'multer';

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/x-wav',
  'audio/x-m4a',
];

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// 50 MB max for audio, 5 MB for images
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5  * 1024 * 1024;

/**
 * Multer instance that accepts any combination of:
 *   - audio  (field name 'audio')  — mp3/wav/ogg/flac/aac, max 50 MB
 *   - cover  (field name 'cover')  — jpg/png/webp, max 5 MB
 *   - avatar (field name 'avatar') — jpg/png/webp, max 5 MB
 *   - before (field name 'before') — audio, max 50 MB
 *   - after  (field name 'after')  — audio, max 50 MB
 */
export const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_AUDIO_SIZE, // Multer's single limit; enforce per-type in fileFilter
    files: 4,
  },

  fileFilter(req, file, cb) {
    const audioFields = ['audio', 'before', 'after'];
    const imageFields = ['cover', 'avatar'];

    if (audioFields.includes(file.fieldname)) {
      if (!AUDIO_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid audio type: ${file.mimetype}. Allowed: MP3, WAV, OGG, FLAC, AAC`));
      }
    } else if (imageFields.includes(file.fieldname)) {
      if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid image type: ${file.mimetype}. Allowed: JPG, PNG, WebP`));
      }
      // Enforce smaller limit for images
      if (file.size > MAX_IMAGE_SIZE) {
        return cb(new Error('Image exceeds 5 MB limit.'));
      }
    }

    cb(null, true);
  },
});

/**
 * Field config for track upload: audio + cover image.
 * Usage: upload.fields(trackFields)
 */
export const trackFields = [
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
];

/**
 * Field config for before/after project.
 */
export const baFields = [
  { name: 'before', maxCount: 1 },
  { name: 'after',  maxCount: 1 },
];
