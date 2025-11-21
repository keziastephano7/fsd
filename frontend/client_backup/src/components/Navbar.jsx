import React, { useContext, useState, useEffect, useRef } from 'react';
// import React, { useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import SearchBar from './SearchBar';
import API from '../api';
import CreatePost from './CreatePost';

// dark mode
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../ThemeContext';

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
    sm: "ring-1 ring-purple-500/20",
    md: "ring-2 ring-purple-500/20",
    lg: "ring-3 ring-purple-500/20"
  };

  useEffect(() => {
    if (user?.avatarUrl) {
      setSrc(buildUrl(user.avatarUrl));
      setIsLoading(false); // Assume image is ready
    } else {
      setSrc(fallbackAvatar);
      setIsLoading(true);
    }
    // setSrc(buildUrl(user?.avatarUrl) || fallbackAvatar);
    // setIsLoading(true);
  }, [user]);

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-full animate-pulse" />
      )}
      <img
        src={src}
        alt={user?.name || 'User avatar'}
        className={`w-full h-full rounded-full object-cover transition-all duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${ringClasses[size]} hover:ring-purple-500/40 shadow-sm`}
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

  const { isDark } = useTheme(); 

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isHoveringCreate, setIsHoveringCreate] = useState(false);

  // Enhanced scroll effect with persistent transparency
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotifOpen(false);
  }, [location]);

  // fetch unread count periodically
  useEffect(() => {
    let mounted = true;
    const getCount = async () => {
      try {
        const res = await API.get('/notifications/unread-count');
        if (mounted) setUnreadCount(res.data.count || 0);
      } catch (e) {
        // ignore (not logged in)
      }
    };
    getCount();
    const t = setInterval(getCount, 15000); // refresh every 15s
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const openNotifications = async () => {
    setIsNotifOpen((s) => !s);
    if (!isNotifOpen) {
      try {
        const res = await API.get('/notifications');
        const notifs = res.data || [];
        setNotifications(notifs);

        // mark unread notifications as read on the server
        const unread = notifs.filter(n => !n.read).map(n => n._id);
        if (unread.length > 0) {
          try {
            await Promise.all(unread.map(id => API.put(`/notifications/${id}/read`)));
            // mark them read locally
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          } catch (e) {
            console.error('Failed to mark notifications read', e);
          }
        }
        setUnreadCount(0);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
  };

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
          className="create-post-modal bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border border-gray-200/50 dark:border-gray-700/50 max-h-[85vh] flex flex-col backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100/50 dark:border-gray-800/50 flex-shrink-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create Post</h3>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
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
      path: `/groups`, 
      label: 'Groups', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
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
          ? 'bg-white/50 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-300/30 dark:border-gray-600/30'
          : 'bg-white/50 dark:bg-gray-900/85 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50'
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
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500/90 via-purple-600/90 to-pink-500/90 group-hover:shadow-xl group-hover:shadow-purple-500/20 transition-all duration-300 backdrop-blur-sm"
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
                  {/* Subtle Theme Toggle */}
                  <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
                    <ThemeToggle size="sm" />
                  </div>
                  
                  <SearchBar />
                  
                  {/* Groups Button */}
                  <Link
                    to="/groups"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/90 to-pink-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-400/20 backdrop-blur-sm"
                    aria-label="Groups"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="hidden lg:block">Groups</span>
                  </Link>
                  
                  {/* Notifications */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Notifications"
                    onClick={openNotifications}
                    className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200 backdrop-blur-sm border border-transparent hover:border-gray-200/30 dark:hover:border-gray-600/30"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[18px] h-4 inline-flex items-center justify-center px-1.5 text-[11px] bg-red-500 text-white rounded-full ring-2 ring-white/80 dark:ring-gray-900/80">
                        {unreadCount}
                      </span>
                    )}
                    {/* Notification dropdown */}
                    {isNotifOpen && (
                      <div className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 overflow-hidden z-50 backdrop-blur-xl">
                        <div className="p-3 text-sm font-semibold border-b border-gray-100/50 dark:border-gray-600/50">Notifications</div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 && (
                            <div className="p-3 text-xs text-gray-500">No notifications</div>
                          )}
                          {notifications.map((n) => (
                            <div key={n._id} onClick={() => { 
                                const dest = `/posts/${n.post?._id || n.post}`;
                                console.debug('Notification click:', n, 'n.post ->', n.post, 'navigate to', dest);
                                setIsNotifOpen(false); 
                                navigate(dest);
                              }} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer">
                              <img src={n.actor?.avatarUrl || '/images/default-avatar.png'} alt={n.actor?.name} className="w-9 h-9 rounded-full object-cover" />
                              <div className="flex-1">
                                <div className="text-sm text-gray-800 dark:text-gray-200">{
                                  n.type === 'like' ? `${n.actor?.name || 'Someone'} liked your post` : `${n.actor?.name || 'Someone'} commented: ${n.comment?.text || ''}`
                                }</div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.button>

                  {/* Create Post Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setIsHoveringCreate(true)}
                    onHoverEnd={() => setIsHoveringCreate(false)}
                    onClick={() => setCreateModalOpen(true)}
                    className="create-post-button flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-400/20 backdrop-blur-sm"
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
                      className="profile-button flex items-center p-1.5 rounded-2xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200 border border-transparent hover:border-gray-200/30 dark:hover:border-gray-600/30 backdrop-blur-sm"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      {/* Only show user avatar in the trigger button */}
                      {console.log('user in button:', user)}
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
                          className="absolute right-0 mt-3 w-64 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-600/50 overflow-hidden z-50 backdrop-blur-xl"
                          role="menu"
                        >
                          {/* Profile Header */}
                          <div className="p-4 bg-gradient-to-br from-blue-50/80 to-purple-50/80 dark:from-gray-700/80 dark:to-gray-800/80 border-b border-gray-100/50 dark:border-gray-600/50">
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
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200 group backdrop-blur-sm"
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
                            <div className="border-t border-gray-100/50 dark:border-gray-600/50 my-2"></div>
                            
                            {/* Logout Button */}
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 w-full transition-colors duration-200 group backdrop-blur-sm"
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
                  {/* Subtle Theme Toggle for mobile */}
                  <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
                    <ThemeToggle size="sm" />
                  </div>
                  
                  <SearchBar />
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="hamburger-button p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200 border border-gray-200/30 dark:border-gray-600/30 backdrop-blur-sm"
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
                  className="create-post-button md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500/90 to-purple-600/90 shadow-2xl text-white text-2xl font-bold flex items-center justify-center z-40 border border-blue-400/20 backdrop-blur-sm"
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
                {/* Subtle Theme Toggle for logged out users */}
                <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm border border-gray-200/30 dark:border-gray-600/30">
                  <ThemeToggle size="sm" />
                </div>
                
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200 backdrop-blur-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-blue-400/20 backdrop-blur-sm"
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
              className="mobile-menu md:hidden overflow-hidden bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-600/50 mt-2 backdrop-blur-xl"
            >
              <div className="p-3 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200 group backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="text-blue-600 dark:text-blue-400">
                      {item.icon}
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-100/50 dark:border-gray-600/50 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20 w-full transition-colors duration-200 backdrop-blur-sm"
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