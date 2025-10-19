import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import PostCard from '../components/PostCard';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/* Inline helper components */
function TagBanner({ activeTags, onClear }) {
  if (!activeTags || activeTags.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/90 dark:bg-[#071226]/80 p-3 border border-purple-100 dark:border-purple-900 shadow-sm flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm text-neutral-700 dark:text-neutral-300">Filtered by:</div>
        {activeTags.map(t => (
          <span key={t} className="text-sm px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">#{t}</span>
        ))}
      </div>
      <button onClick={onClear} className="text-sm text-neutral-600 dark:text-neutral-300 underline">Clear</button>
    </motion.div>
  );
}

function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white/90 dark:bg-[#071226]/80 rounded-2xl p-4 border border-purple-100 dark:border-purple-900 shadow" />
      ))}
    </div>
  );
}

export default function Feed({ tagFilter: propTagFilter } = {}) {
  const { user } = useContext(AuthContext);
  const params = useParams();
  const navigate = useNavigate();
  const tagParam = params?.tag;
  const tagFilter = propTagFilter || tagParam || null;

  const activeTagsArray = tagFilter
    ? tagFilter.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateMobile, setShowCreateMobile] = useState(false);

  const feedColumnRef = useRef(null);

  const hydratePostsWithCurrentUser = useCallback((rawPosts = []) => {
    if (!user) return rawPosts;
    return rawPosts.map(p => {
      const authorId = (typeof p.author === 'object' && (p.author._id || p.author.id)) || p.author;
      if (String(authorId) === String(user.id)) {
        return { ...p, author: { ...(user || {}), id: user.id, _id: user.id } };
      }
      return p;
    });
  }, [user]);

  const load = useCallback(async (signal) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/posts', { signal });
      const raw = Array.isArray(res.data) ? res.data : [];
      const hydrated = hydratePostsWithCurrentUser(raw);
      setAllPosts(hydrated);
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message === 'canceled') return;
      console.error('Failed to load posts:', err);
      setError(err?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [user, hydratePostsWithCurrentUser]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const displayedPosts = React.useMemo(() => {
    if (activeTagsArray.length === 0) return allPosts;
    return allPosts.filter(post => {
      const postTags = (post.tags || []).map(t => String(t).toLowerCase());
      return activeTagsArray.some(activeTag => postTags.includes(activeTag));
    });
  }, [allPosts, activeTagsArray]);

  const prependIfNotExists = useCallback((newPost) => {
    const newId = newPost?._id || newPost?.id;
    if (!newId) {
      setAllPosts(prev => [newPost, ...prev]);
      return;
    }
    setAllPosts(prev => {
      if (prev.some(p => (p._id || p.id) === newId)) return prev;
      return [newPost, ...prev];
    });
  }, []);

  const onPostCreatedInline = useCallback((newPost) => {
    let hydrated = newPost;
    if ((typeof newPost.author === 'string' || typeof newPost.author === 'number') && String(newPost.author) === String(user?.id)) {
      hydrated = { ...newPost, author: { ...(user || {}), id: user.id, _id: user.id } };
    }
    prependIfNotExists(hydrated);
  }, [user, prependIfNotExists]);

  useEffect(() => {
    const onPostCreated = (e) => {
      const newPost = e.detail;
      if (!newPost) return;
      let hydrated = newPost;
      if ((typeof newPost.author === 'string' || typeof newPost.author === 'number') && String(newPost.author) === String(user?.id)) {
        hydrated = { ...newPost, author: { ...(user || {}), id: user.id, _id: user.id } };
      } else if (newPost.author && typeof newPost.author === 'object' && String((newPost.author._id || newPost.author.id)) === String(user?.id)) {
        hydrated = { ...newPost, author: { ...newPost.author, ...(user || {}) } };
      }
      prependIfNotExists(hydrated);
    };
    const onPostDeleted = (e) => {
      const { postId } = e.detail || {};
      if (!postId) return;
      setAllPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    };
    const onPostUpdated = (e) => {
      const updated = e.detail || {};
      const updatedId = updated._id || updated.id;
      if (!updatedId) return;
      setAllPosts(prev => prev.map(p => ((p._id || p.id) === updatedId ? { ...p, ...updated } : p)));
    };

    window.addEventListener('post:created', onPostCreated);
    window.addEventListener('post:deleted', onPostDeleted);
    window.addEventListener('post:updated', onPostUpdated);

    return () => {
      window.removeEventListener('post:created', onPostCreated);
      window.removeEventListener('post:deleted', onPostDeleted);
      window.removeEventListener('post:updated', onPostUpdated);
    };
  }, [user, prependIfNotExists]);

  const handleSinglePostUpdate = useCallback((updated) => {
    if (!updated) return;
    const id = updated._id || updated.id;
    if (!id) return;
    setAllPosts(prev => prev.map(p => ((p._id || p.id) === id ? { ...p, ...updated } : p)));
  }, []);

  const clearFilter = () => navigate('/');
  const retryLoad = () => {
    const controller = new AbortController();
    load(controller.signal);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-pink-50/30 dark:from-[#071226]">
        <div className="max-w-xl text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Welcome</h2>
          <p className="text-neutral-600 dark:text-neutral-300">Please sign in to view your feed and create posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-purple-50/40 to-pink-50/30 dark:from-[#071226]">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main ref={feedColumnRef} className="space-y-6">
          <TagBanner activeTags={activeTagsArray} onClear={clearFilter} />

          <AnimatePresence>
            {showCreateMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-start justify-center p-6"
                role="dialog"
                aria-modal="true"
              >
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateMobile(false)} aria-hidden />
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="relative bg-white dark:bg-[#071226] rounded-2xl w-full max-w-lg p-6 shadow-2xl"
                >
                  {/* If you still want to allow create post on mobile */}
                  {/* For now, CreatePost component is removed so this can be disabled or replaced */}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <LoadingSkeleton count={3} />
          ) : error ? (
            <div className="rounded-2xl p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <div className="text-red-700">{error}</div>
              <button onClick={retryLoad} className="mt-3 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Retry
              </button>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="rounded-2xl p-6 bg-white/90 dark:bg-[#071226] border border-purple-100 dark:border-purple-900 text-center select-none">
              No posts yet
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {displayedPosts.map(post => (
                  <motion.div
                    key={post._id || post.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <PostCard post={post} onUpdate={handleSinglePostUpdate} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
