// ─── User session (kept in localStorage — lightweight, no sensitive data) ──────

export function getUser() {
  // Try "user" key first
  const u = localStorage.getItem("user");
  if (u) return JSON.parse(u);

  // Fallback: decode from access_token
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub || payload.id,
      name: payload.name || payload.full_name || payload.email?.split("@")[0],
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function setUser(user) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dgca_user', JSON.stringify(user));
}

export function clearUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('dgca_user');
  localStorage.removeItem('user'); // adjust key to match what getUser() uses

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
