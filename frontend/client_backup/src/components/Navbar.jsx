import React, { useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import SearchBar from './SearchBar';
import CreatePost from './CreatePost';

// UserAvatar reused
function UserAvatar({ user }) {
  const fallbackAvatar = '/images/default-avatar.png';
  const avatarSrc = buildUrl(user?.avatarUrl) || fallbackAvatar;
  const [src, setSrc] = useState(avatarSrc);
  useEffect(() => {
    setSrc(buildUrl(user?.avatarUrl) || fallbackAvatar);
  }, [user]);
  return (
    <img
      src={src}
      alt={user.name}
      className="w-12 h-12 rounded-full shadow-xl ring-4 ring-purple-500/70 object-cover"
      loading="lazy"
      onError={() => setSrc(fallbackAvatar)}
      style={{
        borderRadius: '50%',
        boxShadow: '0 6px 18px 0 rgba(120, 40, 220, 0.10)',
      }}
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60"
                aria-modal="true"
                role="dialog"
                aria-label="Create new post"
              >
                <motion.div
                  initial={{ y: 24, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 24, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="create-post-modal bg-white dark:bg-[#071226] rounded-3xl shadow-2xl max-w-lg w-full p-8"
                  tabIndex={-1}
                  ref={el => { if (el) el.scrollTop = 0; }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">Create Post</h3>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      className="p-3 rounded-xl text-purple-500 hover:bg-purple-100 dark:hover:bg-purple-800"
                      aria-label="Close create post modal"
                    >
                      ✕
                    </button>
                  </div>
                  <CreatePost
                    onCreated={post => {
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
          ? 'bg-white/80 dark:bg-[#0a1628]/80 backdrop-blur-md shadow-lg'
          : 'bg-transparent dark:bg-transparent'
      } border-b border-neutral-200/25 dark:border-neutral-800/30`}
      style={{ boxShadow: isScrolled ? '0 6px 24px -10px rgba(120, 40, 220, 0.13)' : '' }}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="h-16 flex items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-4 group" aria-label="Luna Home">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 mr-2" />
            <span className="text-2xl sm:text-3xl font-extrabold tracking-wide bg-gradient-to-r from-blue-500 via-purple-600 to-purple-700 bg-clip-text text-transparent select-none pointer-events-none drop-shadow-md">
              Luna
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-4">
                  <SearchBar />
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="create-post-button flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 font-bold text-white text-3xl shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-purple-500"
                    aria-label="Create new post"
                  >
                    +
                  </button>
                  <button
                    aria-label="Notifications"
                    className="relative p-3 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse ring-2 ring-purple-500" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="profile-button flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      <UserAvatar user={user} />
                      <span className="hidden lg:inline-block max-w-[140px] truncate text-base font-semibold text-neutral-900 dark:text-white select-none ml-1">
                        {user.name}
                      </span>
                      <svg className={`ml-1 w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -15, scale: 0.95 }}
                          transition={{ duration: 0.22 }}
                          className="profile-menu absolute right-0 mt-4 w-80 rounded-3xl bg-white dark:bg-[#181a2e] shadow-2xl overflow-hidden"
                          style={{
                            backdropFilter: 'blur(11px)',
                            boxShadow: '0 10px 36px 0 rgba(84, 36, 184, 0.2)',
                            border: '1.5px solid #a68ff3',
                          }}
                          role="menu"
                          aria-label="User menu"
                        >
                          <div className="flex flex-col items-center py-6 px-6 bg-gradient-to-r from-blue-50 via-purple-50 to-purple-100 dark:bg-[#19173b] relative select-none">
                            <div className="absolute left-0 top-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600 opacity-60"></div>
                            <img
                              src={buildUrl(user.avatarUrl) || '/images/default-avatar.png'}
                              alt={user.name}
                              className="w-20 h-20 rounded-full ring-4 ring-purple-300 shadow-xl object-cover mb-2"
                            />
                            <span className="text-xl font-bold text-purple-900 dark:text-purple-200 mt-1">{user.name}</span>
                            <span className="text-base text-purple-700 dark:text-purple-200 mb-1">{user.email}</span>
                            {user.username &&
                              <span className="text-sm font-mono text-neutral-400 dark:text-neutral-400 mb-1">@{user.username}</span>
                            }
                          </div>
                          <div className="border-t border-purple-100 dark:border-purple-800 px-4 py-3 flex flex-col gap-1.5 bg-white dark:bg-[#19173b]">
                            <Link
                              to={`/profile/${user.id}`}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-100 dark:hover:from-[#272155] dark:hover:to-[#373067] transition transform hover:scale-[1.03] focus:outline-none"
                              role="menuitem"
                            >
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2}
                                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                              <span className="font-semibold text-purple-800 dark:text-purple-200">Your Profile</span>
                            </Link>
                            <Link
                              to={`/profile/${user.id}/edit`}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-100 dark:hover:from-[#272155] dark:hover:to-[#373067] transition transform hover:scale-[1.03] focus:outline-none"
                              role="menuitem"
                            >
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth={2}
                                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              <span className="font-semibold text-purple-800 dark:text-purple-200">Settings</span>
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition transform hover:scale-[1.03] focus:outline-none"
                              role="menuitem"
                            >
                              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                              </svg>
                              <span className="font-semibold text-red-500">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
                <div className="flex sm:hidden items-center gap-3">
                  <SearchBar />
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="hamburger-button p-3 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                  >
                    {isMenuOpen ? (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="create-post-button sm:hidden fixed bottom-7 right-7 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-purple-700 to-purple-800 shadow-lg text-white text-4xl font-extrabold flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500"
                  aria-label="Create new post"
                >
                  +
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="px-6 py-2 rounded-2xl border border-transparent text-base font-semibold text-purple-700 bg-purple-100 hover:bg-purple-200 dark:text-purple-300 dark:bg-purple-900 dark:hover:bg-purple-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 rounded-2xl text-base font-extrabold bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:scale-105 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
        <AnimatePresence>
          {isMenuOpen && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mobile-menu sm:hidden overflow-hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a1628] rounded-2xl shadow-lg mt-1"
            >
              {/* Mobile menu: Add menu items here if needed */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {CreatePostModalPortal}
    </header>
  );
}
