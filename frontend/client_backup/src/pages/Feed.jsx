import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import PostCard from '../components/PostCard';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

// Modern Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto"> {/* Increased spacing */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/6" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="flex gap-4 mt-4">
            <div className="h-8 bg-gray-200 rounded w-16" />
            <div className="h-8 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Clean Empty State
function EmptyState() {
  return (
    <div className="text-center py-20 max-w-2xl mx-auto"> {/* Increased padding */}
      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to your feed</h3>
      <p className="text-gray-600 mb-8 text-lg">When people you follow start posting, you'll see their content here.</p>
      <button className="px-8 py-3 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors shadow-sm">
        Find people to follow
      </button>
    </div>
  );
}

// Modern Error State
function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-20 max-w-2xl mx-auto"> {/* Increased padding */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Unable to load feed</h3>
      <p className="text-gray-600 mb-6 text-lg">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
      >
        Try Again
      </button>
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
      setError(err?.response?.data?.message || err?.message || 'Failed to load posts');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-black flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Join Luna</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Connect with friends and share your experiences in a beautiful, modern space.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="w-full py-3.5 border border-gray-300 text-gray-900 rounded-2xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8"> {/* Added vertical padding */}
      <div className="max-w-2xl mx-auto px-4">
        {/* Feed Header */}
        <div className="mb-8 text-center"> {/* Increased margin */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Your Feed</h1>
          <p className="text-gray-600 text-lg">Latest updates from your community</p>
        </div>

        {/* Active Filters */}
        {activeTagsArray.length > 0 && (
          <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between"> {/* Increased margin */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Filtered by:</span>
              {activeTagsArray.map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium">
                  #{tag}
                </span>
              ))}
            </div>
            <button
              onClick={clearFilter}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {/* Feed Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={retryLoad} />
        ) : displayedPosts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-8"> {/* Significantly increased spacing between cards */}
            <AnimatePresence>
              {displayedPosts.map((post, index) => (
                <motion.div
                  key={post._id || post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="transform hover:scale-[1.02] transition-transform duration-300" // Added hover effect
                >
                  <PostCard post={post} onUpdate={handleSinglePostUpdate} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}