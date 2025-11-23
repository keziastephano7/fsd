import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { buildUrl } from '../utils/url';

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], tags: [] });
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], tags: [] });
      return;
    }
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        let users = [];
        try {
          const usersRes = await API.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
          users = usersRes.data || [];
        } catch {}
        const postsRes = await API.get('/posts');
        const allPosts = postsRes.data || [];
        const allTags = new Set();
        allPosts.forEach(post => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach(tag => {
              if (String(tag).toLowerCase().includes(searchQuery.toLowerCase())) {
                allTags.add(String(tag).toLowerCase());
              }
            });
          }
        });
        setSearchResults({
          users: users.slice(0, 5),
          tags: Array.from(allTags).slice(0, 5),
        });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleTagClick = (tag) => {
    navigate(`/tag/${encodeURIComponent(tag)}`);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        {isOpen ? (
          <motion.div
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                placeholder="Search users or tags..."
                className="
  w-full pl-10 pr-10 py-2.5 rounded-xl 
  bg-white dark:bg-gray-800 
  border border-gray-200 dark:border-gray-700 
  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
  text-sm 
  text-gray-900 dark:text-white
  placeholder-gray-400 dark:placeholder-gray-500
  transition-all duration-200 shadow-sm
  focus:shadow-blue-500/20
"
                autoFocus
                aria-label="Search users or tags"
                aria-expanded={isOpen}
                aria-controls="search-dropdown"
              />
              
              {/* Search Icon */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Clear Button - Fixed Animation */}
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/4 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 bg-white dark:bg-gray-800 rounded-lg"
                    aria-label="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label="Open search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && searchQuery && (
          <motion.div
            id="search-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-full right-0 mt-2 w-80 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-hidden"
            role="listbox"
          >
            {loading ? (
              <div className="p-6 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">Searching...</p>
              </div>
            ) : searchResults.users.length === 0 && searchResults.tags.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                      Users
                    </h3>
                    <div className="space-y-1">
                      {searchResults.users.map((user) => (
                        <motion.button
                          key={user._id || user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          onClick={() => handleUserClick(user._id || user.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                          role="option"
                          aria-selected="false"
                        >
                          <div className="relative">
                            <img
                              src={buildUrl(user.avatarUrl) || '/images/default-avatar.png'}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              loading="lazy"
                              onError={e => { 
                                e.target.onerror = null; 
                                e.target.src = '/images/default-avatar.png'; 
                              }}
                            />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tags Section */}
                {searchResults.tags.length > 0 && (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
                      Tags
                    </h3>
                    <div className="space-y-1">
                      {searchResults.tags.map((tag, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleTagClick(tag)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 focus:outline-none focus:bg-purple-50 dark:focus:bg-purple-900/20"
                          role="option"
                          aria-selected="false"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">#{tag}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Tag</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Search Tips */}
            {(searchResults.users.length > 0 || searchResults.tags.length > 0) && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Press Enter to search all content
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}