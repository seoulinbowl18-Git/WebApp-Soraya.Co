// Auth helpers (client-side)
export const AUTH_KEY = 'soraya_auth';

export function getAuth() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
}
export function setAuth(session) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('soraya:auth'));
}
export function clearAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('soraya:auth'));
}
export function authHeaders() {
  const a = getAuth();
  return a?.token ? { Authorization: `Bearer ${a.token}` } : {};
}
