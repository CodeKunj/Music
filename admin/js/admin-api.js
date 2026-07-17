import { getSession, signOut, getSupabaseConfig } from './admin-auth.js';

const API_BASE = '/api/admin';

async function fetchWithAuth(url, options = {}) {
  const session = getSession();
  if (!session || !session.access_token) {
    signOut();
    throw new Error('Not authenticated');
  }

  const headers = {
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      signOut();
      throw new Error('Session expired');
    }
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (res.status === 413 || text.includes('Request Entity Too Large')) {
        throw new Error('File is too large! Vercel limits uploads to 4.5MB.');
      }
      throw new Error(`API Error (${res.status}): ${text.substring(0, 50)}...`);
    }

    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

// ─── Stats ──────────────────────────────────────────
export function getStats() {
  return fetchWithAuth('/stats');
}

// ─── Tracks ─────────────────────────────────────────
export function getAllTracks() {
  return fetchWithAuth('/tracks');
}

export function deleteTrack(id) {
  return fetchWithAuth(`/tracks/${id}`, { method: 'DELETE' });
}

// ─── Services ───────────────────────────────────────
export function getAllServices() {
  return fetchWithAuth('/services');
}
export function createService(data) {
  return fetchWithAuth('/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export function updateService(id, data) {
  return fetchWithAuth(`/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export function deleteService(id) {
  return fetchWithAuth(`/services/${id}`, { method: 'DELETE' });
}

// ─── Testimonials ───────────────────────────────────
export function getAllTestimonials() {
  return fetchWithAuth('/testimonials');
}
export function createTestimonial(formData) {
  return fetchWithAuth('/testimonials', { method: 'POST', body: formData });
}
export function updateTestimonial(id, formData) {
  return fetchWithAuth(`/testimonials/${id}`, { method: 'PUT', body: formData });
}
export function deleteTestimonial(id) {
  return fetchWithAuth(`/testimonials/${id}`, { method: 'DELETE' });
}

// ─── Before/After ───────────────────────────────────
export function getAllBAs() {
  return fetchWithAuth('/before-after');
}
export async function uploadFileToSupabase(file, bucket) {
  const session = getSession();
  const config = getSupabaseConfig();
  if (!session || !session.access_token) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() || '';
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2,7)}_${safeName}`;
  const path = `tracks/${filename}`;

  const res = await fetch(`${config.url}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': config.key,
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
  
  // Return the public URL
  return `${config.url}/storage/v1/object/public/${bucket}/${path}`;
}

export function createTrack(data) {
  return fetchWithAuth('/tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export function updateTrack(id, data) {
  return fetchWithAuth(`/tracks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export function deleteBA(id) {
  return fetchWithAuth(`/before-after/${id}`, { method: 'DELETE' });
}

export function createBA(formData) {
  return fetchWithAuth('/before-after', { method: 'POST', body: formData });
}
export function updateBA(id, formData) {
  return fetchWithAuth(`/before-after/${id}`, { method: 'PUT', body: formData });
}

// ─── Contacts ───────────────────────────────────────
export function getAllContacts() {
  return fetchWithAuth('/contacts');
}
export function markContactRead(id) {
  return fetchWithAuth(`/contacts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_read: true })
  });
}
export function deleteContact(id) {
  return fetchWithAuth(`/contacts/${id}`, { method: 'DELETE' });
}
