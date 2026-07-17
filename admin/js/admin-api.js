import { getSession, signOut } from './admin-auth.js';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api/admin' 
  : '/api/admin';

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
    const data = await res.json();
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
export function createTrack(formData) {
  return fetchWithAuth('/tracks', { method: 'POST', body: formData }); // formData handles its own content-type
}
export function updateTrack(id, formData) {
  return fetchWithAuth(`/tracks/${id}`, { method: 'PUT', body: formData });
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
export function createBA(formData) {
  return fetchWithAuth('/before-after', { method: 'POST', body: formData });
}
export function updateBA(id, formData) {
  return fetchWithAuth(`/before-after/${id}`, { method: 'PUT', body: formData });
}
export function deleteBA(id) {
  return fetchWithAuth(`/before-after/${id}`, { method: 'DELETE' });
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
