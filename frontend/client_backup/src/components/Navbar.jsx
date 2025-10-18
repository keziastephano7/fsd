import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const normalizeAvatarUrl = (url) => {
    if (!url) return null;
    const isAbsolute = /^https?:\/\//i.test(url) || url.startsWith('//');
    const backend = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return isAbsolute ? url : `${backend}${url}`;
  };

  const avatarSrc = user?.avatarUrl ? normalizeAvatarUrl(user.avatarUrl) : null;


  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    try { window.dispatchEvent(new CustomEvent('user:loggedout')); } catch (e) {}
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#071226] border-b border-neutral-100 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">SM</div>
              <span className="font-semibold text-lg hidden sm:inline">MySocial</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={`/profile/${user.id}`} className="inline-flex items-center gap-2">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-8 h-8 rounded-full ring-1 ring-neutral-100 dark:ring-neutral-900 object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm text-neutral-600">U</div>
                  )}
                  <span className="text-sm hidden md:inline text-neutral-900 dark:text-neutral-100">{user.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-neutral-700 dark:text-neutral-200">Login</Link>
                <Link to="/signup" className="text-neutral-700 dark:text-neutral-200">Signup</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}