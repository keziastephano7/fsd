import React, { createContext, useState, useEffect } from 'react';
import { setAuthToken } from './api';

export const AuthContext = createContext();

// Make sure to set REACT_APP_API_URL in .env to your backend, e.g. http://localhost:5000
const BACKEND_URL = process.env.REACT_APP_API_URL || window.location.origin;

function normalizeAvatarUrl(url, addTimestamp = false) {
  if (!url) return null;

  const isAbsolute = /^https?:\/\//i.test(url) || url.startsWith('//');
  const full = isAbsolute ? url : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${url}`;

  if (addTimestamp) {
    const sep = full.includes('?') ? '&' : '?';
    return `${full}${sep}t=${Date.now()}`;
  }

  return full;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      const u = raw ? JSON.parse(raw) : null;
      if (u) {
        u.id = u.id || u._id || null;
        u.avatarUrl = normalizeAvatarUrl(u.avatarUrl, false);
      }
      return u;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
  }, []);

  const login = (userObj, token) => {
    const u = { ...userObj, id: userObj.id || userObj._id || null };
    u.avatarUrl = normalizeAvatarUrl(u.avatarUrl, false);
    setUser(u);
    setAuthToken(token);
    localStorage.setItem('user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (partialOrFullUser) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), ...(partialOrFullUser || {}) };
      updated.id = updated.id || updated._id || null;
      updated.avatarUrl = normalizeAvatarUrl(updated.avatarUrl, true);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
