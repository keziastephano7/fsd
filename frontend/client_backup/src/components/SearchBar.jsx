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

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        {isOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            className="relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Search users/tags..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-xs transition"
              autoFocus
              aria-label="Search users or tags"
              aria-expanded={isOpen}
              aria-controls="search-dropdown"
            />
            {/* <svg
              className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500"
              fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg> */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-purple-600 dark:hover:text-neutral-300"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </motion.div>
        ) : (
          <button
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 80);
            }}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-purple-600 dark:text-purple-400 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Open search"
          >
            <svg
              className="w-5 h-5"
              fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && searchQuery && (
          <motion.div
            id="search-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-1 w-72 rounded-xl bg-white dark:bg-[#16234b] border border-neutral-200 dark:border-neutral-800 shadow-xl z-50"
            role="listbox"
          >
            {loading ? (
              <div className="p-5 text-center">
                <svg className="w-6 h-6 animate-spin mx-auto text-purple-600" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.22" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">Searching...</p>
              </div>
            ) : searchResults.users.length === 0 && searchResults.tags.length === 0 ? (
              <div className="p-5 text-center">
                <svg className="w-7 h-7 mx-auto text-neutral-400 mb-1" fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">No results found</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Users Section */}
                {searchResults.users.length > 0 && (
                  <div className="p-2">
                    <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-1 px-1 select-none">
                      Users
                    </h3>
                    {searchResults.users.map((user) => (
                      <button
                        key={user._id || user.id}
                        onClick={() => handleUserClick(user._id || user.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition focus:outline-none focus:bg-purple-50 dark:focus:bg-purple-950"
                        role="option"
                        aria-selected="false"
                      >
                        <img
                          src={buildUrl(user.avatarUrl) || '/images/default-avatar.png'}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover"
                          loading="lazy"
                          onError={e => { e.target.onerror = null; e.target.src = '/images/default-avatar.png'; }}
                        />
                        <div className="text-left flex-1 min-w-0 overflow-hidden">
                          <p className="font-semibold text-neutral-900 dark:text-white text-xs truncate">{user.name}</p>
                          <p className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Tags Section */}
                {searchResults.tags.length > 0 && (
                  <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-1 px-1 select-none">
                      Tags
                    </h3>
                    {searchResults.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition focus:outline-none focus:bg-purple-50 dark:focus:bg-purple-950"
                        role="option"
                        aria-selected="false"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center select-none">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="font-semibold text-neutral-900 dark:text-white text-xs truncate">#{tag}</p>
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
