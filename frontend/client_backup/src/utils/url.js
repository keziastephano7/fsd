import API from '../api';

export function getServerBase() {
  const baseFromApi = API?.defaults?.baseURL || '';
  if (baseFromApi) {
    // strip trailing /api or /api/ if present
    return baseFromApi.replace(/\/api\/?$/, '');
  }
  const env = process.env.REACT_APP_API_URL;
  if (env) return env.replace(/\/api\/?$/, '');
  return window.location.origin;
}

/**
 * buildUrl(path)
 * - If path is already absolute (http/https or protocol-relative) returns it unchanged.
 * - If path is relative, prefix with server base (http://localhost:5000).
 * - Returns null for falsy input.
 */
export function buildUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith('//')) return path;
  const base = getServerBase();
  const separator = path.startsWith('/') ? '' : '/';
  return `${base}${separator}${path}`;
}
