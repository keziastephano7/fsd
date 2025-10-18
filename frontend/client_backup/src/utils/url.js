// small helper to build correct server-side URLs for images and other assets
// Uses the axios API instance baseURL (from src/api.js) if available.
// Falls back to REACT_APP_API_URL or window.location.origin.

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
  // ensure single slash between base and path
  const separator = path.startsWith('/') ? '' : '/';
  return `${base}${separator}${path}`;
}