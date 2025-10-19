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

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
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
        } catch {
          // User search fallback
        }

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

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        {isOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Search users or tags..."
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-sm transition-all duration-300"
              autoFocus
              aria-label="Search users or tags"
              aria-expanded={isOpen}
              aria-controls="search-dropdown"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </motion.div>
        ) : (
          <button
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-purple-600 dark:text-purple-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Open search"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && searchQuery && (
          <motion.div
            id="search-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#0f1c2e] border-2 border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-50"
            role="listbox"
          >
            {loading ? (
              <div className="p-8 text-center">
                <svg
                  className="w-8 h-8 animate-spin mx-auto text-purple-600"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Searching...</p>
              </div>
            ) : searchResults.users.length === 0 && searchResults.tags.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-neutral-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">No results found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2 px-2 select-none">
                      Users
                    </h3>
                    {searchResults.users.map((user) => (
                      <button
                        key={user._id || user.id}
                        onClick={() => handleUserClick(user._id || user.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:bg-purple-100 dark:focus:bg-purple-900"
                        role="option"
                        aria-selected="false"
                      >
                        <img
                          src={buildUrl(user.avatarUrl) || '/images/default-avatar.png'}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                          onError={e => { e.target.onerror = null; e.target.src = '/images/default-avatar.png'; }}
                        />
                        <div className="text-left flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{user.name}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tags Section */}
                {searchResults.tags.length > 0 && (
                  <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-2 px-2 select-none">
                      Tags
                    </h3>
                    {searchResults.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:bg-purple-100 dark:focus:bg-purple-900"
                        role="option"
                        aria-selected="false"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center select-none">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">#{tag}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
