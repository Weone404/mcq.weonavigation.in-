// ─── User session (kept in localStorage — lightweight, no sensitive data) ──────

export function getUser() {
  if (typeof window === 'undefined') return null;

  // Try "user" key first, then legacy login key "dgca_user"
  const u = localStorage.getItem('user') || localStorage.getItem('dgca_user');
  if (u) {
    try {
      return JSON.parse(u);
    } catch {
      // corrupted data — fall through to token decode
    }
  }

  // Fallback: decode from access_token
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.id,
      name: payload.name || payload.full_name || payload.email?.split('@')[0],
      email: payload.email,
      is_verified: false, // token fallback — will be refreshed by fetchAndStoreUser
    };
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dgca_user');
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
}

// ─── Fetch fresh user from DB and store in localStorage ──────────────────────
// Call this on page load to always get the latest is_verified status from DB.

export async function fetchAndStoreUser({ email, phone } = {}) {
  if (!email && !phone) return null;
  const query = email
    ? `email=${encodeURIComponent(email)}`
    : `phone=${encodeURIComponent(phone)}`;
  try {
    const res = await fetch(`/api/user?${query}`);
    if (!res.ok) return null;
    const user = await res.json();
    if (user && (user.email || user.phone)) {
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
  } catch {
    // network error — return null, caller handles it
  }
  return null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── Results ──────────────────────────────────────────────────────────────────

export async function getResults(email) {
  return apiFetch(`/api/results?email=${encodeURIComponent(email)}`);
}

export async function saveResult(result) {
  return apiFetch('/api/results', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  return apiFetch('/api/leaderboard');
}

export async function updateLeaderboard(user, score, total, chapterId) {
  return apiFetch('/api/leaderboard', {
    method: 'POST',
    body: JSON.stringify({ email: user.email, name: user.name, score, total, chapterId }),
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(email) {
  return apiFetch(`/api/stats?email=${encodeURIComponent(email)}`);
}

// ─── User (register / fetch from DB) ─────────────────────────────────────────

export async function registerUser(userData) {
  return apiFetch('/api/user', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}