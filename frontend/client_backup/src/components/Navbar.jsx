import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import SearchBar from './SearchBar';
import CreatePost from './CreatePost';

// Enhanced UserAvatar with better loading states
function UserAvatar({ user, size = "md" }) {
  const fallbackAvatar = '/images/default-avatar.png';
  const avatarSrc = buildUrl(user?.avatarUrl) || fallbackAvatar;
  const [src, setSrc] = useState(avatarSrc);
  const [isLoading, setIsLoading] = useState(true);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };

  const ringClasses = {
    sm: "ring-1 ring-purple-500/30",
    md: "ring-2 ring-purple-500/30",
    lg: "ring-3 ring-purple-500/30"
  };

  useEffect(() => {
    setSrc(buildUrl(user?.avatarUrl) || fallbackAvatar);
    setIsLoading(true);
  }, [user]);

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full animate-pulse" />
      )}
      <img
        src={src}
        alt={user?.name || 'User avatar'}
        className={`w-full h-full rounded-full object-cover transition-all duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${ringClasses[size]} hover:ring-purple-500/60 shadow-md`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setSrc(fallbackAvatar);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isHoveringCreate, setIsHoveringCreate] = useState(false);

  // Enhanced scroll effect with more distinct background
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target) && 
          !e.target.closest('.profile-button')) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && 
          !e.target.closest('.hamburger-button')) {
        setIsMenuOpen(false);
      }
      if (createModalOpen && !e.target.closest('.create-post-modal') && 
          !e.target.closest('.create-post-button')) {
        setCreateModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [createModalOpen]);

  // Body scroll lock for modal
  useEffect(() => {
    if (createModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [createModalOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    try {
      window.dispatchEvent(new CustomEvent('user:loggedout'));
    } catch (e) {
      console.log('Logout event dispatch error:', e);
    }
  };

  const CreatePostModalPortal = createModalOpen && user ? createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key="create-post-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        aria-modal="true"
        role="dialog"
        aria-label="Create new post"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="create-post-modal bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Post</h3>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Close create post modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <CreatePost
              onCreated={(post) => {
                setCreateModalOpen(false);
                window.dispatchEvent(new CustomEvent('post:created', { detail: post }));
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  const menuItems = [
    { 
      path: `/profile/${user?.id}`, 
      label: 'Your Profile', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      path: `/profile/${user?.id}/edit`, 
      label: 'Settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg border-b border-gray-300/50 dark:border-gray-600/50'
          : 'bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-900/90 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-700/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
            aria-label="Luna Home"
          >
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 group-hover:shadow-xl group-hover:shadow-purple-500/30 transition-all duration-300"
            >
              <img 
                src="/moon.svg" 
                alt="Luna Logo" 
                className="w-6 h-6 filter brightness-0 invert" // Makes the SVG white
              />
            </motion.div>
            <motion.span 
              initial={{ opacity: 0.9 }}
              whileHover={{ opacity: 1 }}
              className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Luna
            </motion.span>
          </Link>
          
          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-3">
                  <SearchBar />
                  
                  {/* Notifications */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Notifications"
                    className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                  </motion.button>

                  {/* Create Post Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setIsHoveringCreate(true)}
                    onHoverEnd={() => setIsHoveringCreate(false)}
                    onClick={() => setCreateModalOpen(true)}
                    className="create-post-button flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-400/30"
                    aria-label="Create new post"
                  >
                    <motion.span
                      animate={{ rotate: isHoveringCreate ? 90 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="text-lg font-bold"
                    >
                      +
                    </motion.span>
                    <span className="hidden lg:block">Create</span>
                  </motion.button>

                  {/* Profile Menu */}
                  <div className="relative" ref={profileMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="profile-button flex items-center p-1.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      {/* Only show user avatar in the trigger button */}
                      <div className="flex items-center gap-2">
                        <UserAvatar user={user} size="sm" />
                        <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[100px] truncate">
                          {user.name}
                        </span>
                      </div>
                      <motion.svg
                        animate={{ rotate: isProfileOpen ? 180 : 0 }}
                        className="w-4 h-4 text-gray-500 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </motion.button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 overflow-hidden z-50"
                          role="menu"
                        >
                          {/* Profile Header */}
                          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-gray-700 dark:to-gray-800 border-b border-gray-100 dark:border-gray-600">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={user} size="md" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">{user.name}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">{user.email}</p>
                                {user.username && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">@{user.username}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="p-2 space-y-1">
                            {menuItems.map((item) => (
                              <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 group"
                                role="menuitem"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                <div className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                                  {item.icon}
                                </div>
                                <span className="font-medium text-sm">{item.label}</span>
                              </Link>
                            ))}
                            
                            {/* Divider */}
                            <div className="border-t border-gray-100 dark:border-gray-600 my-2"></div>
                            
                            {/* Logout Button */}
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors duration-200 group"
                              role="menuitem"
                            >
                              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              <span className="font-medium text-sm">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-2">
                  <SearchBar />
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="hamburger-button p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                    aria-label="Toggle menu"
                    aria-expanded={isMenuOpen}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </motion.button>
                </div>

                {/* Floating Create Button for Mobile */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCreateModalOpen(true)}
                  className="create-post-button md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl text-white text-2xl font-bold flex items-center justify-center z-40 border border-blue-400/30"
                  aria-label="Create new post"
                >
                  <motion.span
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    +
                  </motion.span>
                </motion.button>
              </>
            ) : (
              // Auth Buttons for non-logged in users
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-400/30"
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
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mobile-menu md:hidden overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 mt-2"
            >
              <div className="p-3 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="text-blue-600 dark:text-blue-400">
                      {item.icon}
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-sm">Sign Out</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {CreatePostModalPortal}
    </header>
  );
}