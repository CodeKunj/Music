/* =========================================================
   lib/supabase.js — Supabase Client (service_role)
   Never expose this file or its key to the browser.
   ========================================================= */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

/**
 * Admin Supabase client — bypasses RLS.
 * Use ONLY on the backend, never shipped to the browser.
 */
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Upload a file buffer to Supabase Storage.
 * @param {'audio'|'covers'|'avatars'} bucket
 * @param {string} path — e.g. 'tracks/1234_song.mp3'
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<string>} Public URL
 */
export async function uploadFile(bucket, path, buffer, mimeType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage.
 * @param {'audio'|'covers'|'avatars'} bucket
 * @param {string} path
 */
export async function deleteFile(bucket, path) {
  if (!path) return;
  // Extract path relative to bucket from full public URL
  const relative = path.split(`/${bucket}/`)[1];
  if (!relative) return;
  const { error } = await supabase.storage.from(bucket).remove([relative]);
  if (error) console.warn(`Storage delete warning: ${error.message}`);
}

/**
 * Sanitize a filename: lowercase, spaces→underscores, keep alphanumeric + dots + dashes.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 100);
}
