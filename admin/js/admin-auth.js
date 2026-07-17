export function getSupabaseConfig() {
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-anon"]');
  return {
    url: urlMeta ? urlMeta.content : '',
    key: keyMeta ? keyMeta.content : ''
  };
}

export async function signIn(email, password) {
  const config = getSupabaseConfig();
  try {
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': config.key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error_description || data.msg || 'Login failed' };
    }
    localStorage.setItem('admin_session', JSON.stringify(data));
    return { data, error: null };
  } catch (err) {
    return { error: err.message };
  }
}

export function getSession() {
  try {
    const sessionStr = localStorage.getItem('admin_session');
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  } catch (err) {
    return null;
  }
}

export async function signOut() {
  localStorage.removeItem('admin_session');
  window.location.href = '/admin/login.html';
}

export async function requireAuth() {
  const session = getSession();
  if (!session || !session.access_token) {
    window.location.href = '/admin/login.html';
    return null;
  }
  return session;
}

export async function redirectIfLoggedIn() {
  const session = getSession();
  if (session && session.access_token) {
    window.location.href = '/admin/dashboard.html';
  }
}

