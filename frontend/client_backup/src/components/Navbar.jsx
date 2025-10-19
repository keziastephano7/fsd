import React, { useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import SearchBar from './SearchBar';
import CreatePost from '../components/CreatePost';

function UserAvatar({ user }) {
  const fallbackAvatar = '/images/default-avatar.png';
  const avatarSrc = buildUrl(user?.avatarUrl) || fallbackAvatar;
  const [src, setSrc] = useState(avatarSrc);

  useEffect(() => {
    const newSrc = buildUrl(user?.avatarUrl) || fallbackAvatar;
    if (newSrc !== src) {
      setSrc(newSrc);
    }
  }, [user?.avatarUrl]); // only update if URL actually changes

  const handleError = () => {
    if (src !== fallbackAvatar) {
      setSrc(fallbackAvatar);
    }
  };

  if (!src) {
    return (
      <div
        className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg ring-2 ring-purple-500/70 shadow-md select-none"
        aria-label={`${user?.name || 'User'} avatar fallback`}
      >
        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={user?.name || 'User avatar'}
      className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/70 shadow-md"
      loading="lazy"
      onError={handleError}
      aria-hidden="false"
    />
  );
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-menu') && !e.target.closest('.profile-button')) {
        setIsProfileOpen(false);
      }
      if (!e.target.closest('.mobile-menu') && !e.target.closest('.hamburger-button')) {
        setIsMenuOpen(false);
      }
      if (
        createModalOpen &&
        !e.target.closest('.create-post-modal') &&
        !e.target.closest('.create-post-button')
      ) {
        setCreateModalOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [createModalOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (createModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [createModalOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    try {
      window.dispatchEvent(new CustomEvent('user:loggedout'));
    } catch (e) {}
  };

  const CreatePostModalPortal =
    createModalOpen && user
      ? createPortal(
          <AnimatePresence>
            {createModalOpen && (
              <motion.div
                key="create-post-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black bg-opacity-60"
                aria-modal="true"
                role="dialog"
                aria-label="Create new post"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="create-post-modal relative w-full max-w-lg p-6 bg-white dark:bg-[#071226] rounded-2xl shadow-2xl overflow-auto max-h-[90vh] flex flex-col"
                  tabIndex={-1}
                  ref={(el) => { if (el) el.scrollTop = 0; }}
                >
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Create Post</h3>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      aria-label="Close create post modal"
                    >
                      ✕
                    </button>
                  </div>
                  <CreatePost
                    onCreated={(post) => {
                      setCreateModalOpen(false);
                      window.dispatchEvent(new CustomEvent('post:created', { detail: post }));
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/60 dark:bg-[#0a1628]/70 backdrop-blur-md shadow-md shadow-purple-600/20'
          : 'bg-transparent dark:bg-transparent'
      } border-b border-neutral-200/30 dark:border-neutral-800/40`}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="h-16 sm:h-18 flex items-center justify-between gap-6 relative">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="Luna Home">
            <div className="relative w-12 h-12 rounded-3xl overflow-visible flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500 via-purple-600 to-purple-700 opacity-60 blur-2xl group-hover:opacity-80 transition-opacity"></div>
              <div className="relative w-12 h-12 rounded-3xl bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 flex items-center justify-center shadow-xl shadow-purple-700/50 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-7 h-7 text-white drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M17.293 13.293A8 8 0 116.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
            </div>
            <span className="hidden sm:inline-block text-3xl font-extrabold tracking-wide bg-gradient-to-r from-blue-500 via-purple-600 to-purple-700 bg-clip-text text-transparent select-none pointer-events-none">
              Luna
            </span>
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-4">
                  <SearchBar />

                  {/* Create Post Button */}
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="create-post-button flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 hover:from-blue-700 hover:via-purple-800 hover:to-purple-900 shadow-lg hover:shadow-purple-600 text-white text-3xl font-extrabold transition-transform duration-300 active:scale-90 focus:outline-none focus:ring-4 focus:ring-purple-500"
                    aria-label="Create new post"
                    title="Create Post"
                  >
                    +
                  </button>

                  {/* Notification Button */}
                  <button
                    aria-label="Notifications"
                    className="relative p-2 rounded-2xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <svg
                      className="w-6 h-6 stroke-purple-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-red-400"></span>
                  </button>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="profile-button flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                      aria-label="User menu"
                    >
                      <UserAvatar user={user} />
                      <span className="hidden lg:inline-block max-w-[140px] truncate text-sm font-semibold text-neutral-900 dark:text-white select-none">
                        {user.name}
                      </span>

                      <svg
                        className={`w-5 h-5 text-neutral-600 dark:text-neutral-400 transition-transform duration-300 ease-in-out ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          className="profile-menu absolute right-0 mt-2 w-60 rounded-3xl bg-white dark:bg-[#111d36] border-2 border-purple-600 shadow-2xl overflow-hidden flex flex-col"
                          role="menu"
                          aria-label="User menu"
                        >
                          <div className="px-5 py-4 bg-gradient-to-tr from-blue-50 via-purple-50 to-purple-100 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-purple-950/50 border-b border-purple-600 text-center select-none">
                            <p className="text-lg font-semibold text-purple-900 dark:text-purple-200 truncate">{user.name}</p>
                            <p className="text-xs text-purple-700 dark:text-purple-400 truncate">{user.email}</p>
                          </div>

                          <nav className="flex flex-col py-2">
                            <Link
                              to={`/profile/${user.id}`}
                              className="flex items-center gap-3 px-6 py-3 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors rounded-lg"
                              role="menuitem"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Your Profile
                            </Link>

                            <Link
                              to={`/profile/${user.id}/edit`}
                              className="flex items-center gap-3 px-6 py-3 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors rounded-lg"
                              role="menuitem"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Settings
                            </Link>

                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 dark:text-red-400 transition-colors rounded-lg"
                              role="menuitem"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Sign Out
                            </button>
                          </nav>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile Search + Hamburger */}
                <div className="flex items-center sm:hidden gap-3">
                  <SearchBar />

                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="hamburger-button p-3 rounded-2xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                  >
                    {isMenuOpen ? (
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Create Post Button on Mobile */}
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="create-post-button sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 shadow-lg hover:from-blue-700 hover:via-purple-800 hover:to-purple-900 text-white text-4xl font-extrabold flex items-center justify-center transition-transform duration-300 active:scale-90 focus:outline-none focus:ring-4 focus:ring-purple-500"
                  aria-label="Create new post"
                  title="Create Post"
                >
                  +
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-2xl border border-transparent text-sm font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 dark:text-purple-300 dark:bg-purple-900 dark:hover:bg-purple-800 transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-2xl text-sm font-extrabold bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg hover:shadow-purple-600 transition-transform duration-300 hover:scale-105 active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mobile-menu sm:hidden overflow-hidden border-t border-neutral-200 dark:border-neutral-800"
            >
              {/* Your mobile menu content goes here */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render the CreatePost modal portal */}
      {CreatePostModalPortal}
    </header>
  );
}
