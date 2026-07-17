/* =========================================================
   KUNJ RANA — Music Portfolio
   api.js — Fetch Wrappers for Backend API
   ========================================================= */

// ── Config ────────────────────────────────────────────────
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

// Default request timeout (ms)
const TIMEOUT_MS = 8000;

/**
 * Wraps fetch with a timeout and JSON parsing.
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    throw err;
  }
}

/**
 * Build a query string from a params object.
 * e.g. { genre: 'Bollywood', q: 'love' } → '?genre=Bollywood&q=love'
 * @param {Record<string, string|number>} params
 * @returns {string}
 */
function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!entries.length) return '';
  return '?' + new URLSearchParams(entries).toString();
}

// ── Track Endpoints ────────────────────────────────────────

/**
 * Fetch all tracks, optionally filtered by genre or search query.
 * GET /api/tracks?genre=Hip+Hop&q=love
 * @param {{ genre?: string, q?: string, page?: number, limit?: number }} params
 * @returns {Promise<Track[]>}
 */
export async function getTracks(params = {}) {
  const qs = buildQuery(params);
  return fetchWithTimeout(`${API_BASE}/tracks${qs}`);
}

/**
 * Fetch a single track by its ID.
 * GET /api/tracks/:id
 * @param {string|number} id
 * @returns {Promise<Track>}
 */
export async function getTrackById(id) {
  return fetchWithTimeout(`${API_BASE}/tracks/${id}`);
}

/**
 * Fetch featured track.
 * GET /api/tracks/featured
 * @returns {Promise<Track>}
 */
export async function getFeaturedTrack() {
  return fetchWithTimeout(`${API_BASE}/tracks/featured`);
}

// ── Services Endpoint ──────────────────────────────────────

/**
 * Fetch service offerings from the backend.
 * GET /api/services
 * @returns {Promise<Service[]>}
 */
export async function getServices() {
  return fetchWithTimeout(`${API_BASE}/services`);
}

// ── Testimonials Endpoint ──────────────────────────────────

/**
 * Fetch testimonials.
 * GET /api/testimonials
 * @returns {Promise<Testimonial[]>}
 */
export async function getTestimonials() {
  return fetchWithTimeout(`${API_BASE}/testimonials`);
}

// ── Contact Endpoint ───────────────────────────────────────

/**
 * Submit a contact / booking inquiry.
 * POST /api/contact
 * @param {{ name: string, email: string, projectType: string, budget: string, message: string }} data
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function submitContact(data) {
  return fetchWithTimeout(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ── Before/After Endpoint ──────────────────────────────────

/**
 * Fetch before/after audio comparison projects.
 * GET /api/before-after
 * @returns {Promise<BeforeAfterProject[]>}
 */
export async function getBeforeAfterProjects() {
  return fetchWithTimeout(`${API_BASE}/before-after`);
}

// ── Type Definitions (JSDoc for IDE support) ───────────────

/**
 * @typedef {Object} Track
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} genre
 * @property {string} cover    — URL to cover image
 * @property {string} audio    — URL to audio file
 * @property {string} duration — e.g. "3:45"
 * @property {string} [description]
 * @property {number} [plays]
 */

/**
 * @typedef {Object} Service
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} icon     — icon name key
 * @property {string[]} features
 */

/**
 * @typedef {Object} Testimonial
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} quote
 * @property {string} avatar
 * @property {number} rating  — 1-5
 */

/**
 * @typedef {Object} BeforeAfterProject
 * @property {string} id
 * @property {string} projectName
 * @property {string} artist
 * @property {string} beforeAudio
 * @property {string} afterAudio
 */
