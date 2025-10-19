import React, { useEffect, useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

function ProfileDash({ user, postsCount, onEdit }) {
  if (!user) return null;
  
  return (
    <aside className="hidden xl:flex xl:flex-col w-72 shrink-0">
      <div className="sticky top-20 rounded-3xl bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-900/50 overflow-hidden transition-all duration-300 hover:shadow-purple-500/20 hover:scale-[1.01]">
        
        <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
        </div>

        <div className="px-6 pb-6 -mt-10 relative z-10">
          <div className="flex justify-center mb-4">
            {user.avatarUrl ? (
              <img 
                src={buildUrl(user.avatarUrl)} 
                alt={user.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-[#0f1c2e] shadow-xl ring-4 ring-purple-500/30 transition-transform duration-300 hover:scale-105" 
              />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white border-4 border-white dark:border-[#0f1c2e] shadow-xl ring-4 ring-purple-500/30 transition-transform duration-300 hover:scale-105">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            <h2 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
              {user.name}
            </h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed px-2 line-clamp-2">
              {user.bio || '✨ No bio yet — add one to shine!'}
            </p>
          </div>

          <div className="mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-purple-300 dark:via-purple-700 to-transparent mb-3"></div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-purple-200/50 dark:border-purple-800/50">
                <div className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {postsCount}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Posts
                </div>
              </div>

              <div className="text-center p-2.5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200/50 dark:border-purple-800/50">
                <div className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {user.followers?.length ?? 0}
                </div>
                <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Followers
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={onEdit} 
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function Feed({ tagFilter: propTagFilter } = {}) {
  const { user } = useContext(AuthContext);
  const params = useParams();
  const tagParam = params?.tag;
  const navigate = useNavigate();
  
  // Support both single tag and multiple tags
  const tagFilter = propTagFilter || tagParam || null;
  
  // Parse multiple tags
  const activeTagsArray = tagFilter 
    ? tagFilter.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
    : [];

  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper: hydrate author info
  const hydratePostsWithCurrentUser = useCallback((rawPosts = []) => {
    if (!user) return rawPosts;
    return rawPosts.map(p => {
      if ((typeof p.author === 'string' || typeof p.author === 'number') && String(p.author) === String(user.id)) {
        return { ...p, author: { ...(user || {}), id: user.id, _id: user.id } };
      }
      if (p.author && typeof p.author === 'object') {
        const aId = p.author._id || p.author.id || null;
        if (String(aId) === String(user.id)) {
          return { ...p, author: { ...p.author, ...(user || {}) } };
        }
      }
      return p;
    });
  }, [user]);

  // Load ALL posts
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
      if (err.name === 'AbortError' || err.message === 'canceled') return;
      console.error('Failed to load posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [user, hydratePostsWithCurrentUser]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Filter posts CLIENT-SIDE
  const displayedPosts = React.useMemo(() => {
    if (activeTagsArray.length === 0) {
      return allPosts;
    }
    
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
    window.addEventListener('post:created', onPostCreated);
    return () => window.removeEventListener('post:created', onPostCreated);
  }, [user, prependIfNotExists]);

  useEffect(() => {
    const onPostDeleted = (e) => {
      const { postId } = e.detail || {};
      if (!postId) return;
      setAllPosts(prev => prev.filter(p => (p._id || p.id) !== postId));
    };
    window.addEventListener('post:deleted', onPostDeleted);
    return () => window.removeEventListener('post:deleted', onPostDeleted);
  }, []);

  useEffect(() => {
    const onUserUpdated = (e) => {
      const updated = e.detail || {};
      const updatedId = updated.id || updated._id || updated.userId || null;
      if (!updatedId) return;

      setAllPosts(prev => prev.map(p => {
        const authorId = p.author?._id || p.author || p.authorId;
        if (String(authorId) === String(updatedId)) {
          const mergedAuthor = { ...(p.author || {}), ...(updated || {}) };
          mergedAuthor._id = mergedAuthor._id || mergedAuthor.id || updatedId;
          mergedAuthor.id = mergedAuthor.id || mergedAuthor._id;
          return { ...p, author: mergedAuthor };
        }
        return p;
      }));
    };
    window.addEventListener('user:updated', onUserUpdated);
    return () => window.removeEventListener('user:updated', onUserUpdated);
  }, []);

  const onPostCreatedInline = useCallback((newPost) => {
    let hydrated = newPost;
    if ((typeof newPost.author === 'string' || typeof newPost.author === 'number') && String(newPost.author) === String(user?.id)) {
      hydrated = { ...newPost, author: { ...(user || {}), id: user.id, _id: user.id } };
    }
    prependIfNotExists(hydrated);
  }, [user, prependIfNotExists]);

  const handleEditProfile = () => {
    if (!user) return;
    navigate(`/profile/${user.id}/edit`);
  };

  const userPostsCount = allPosts.filter(p => {
    const authorId = p.author?._id || p.author || p.authorId;
    return String(authorId) === String(user?.id || user?._id);
  }).length;

  const clearFilter = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0a1628] dark:via-[#0f1c2e] dark:to-[#1a1f3a]">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 116.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
            Welcome to Luna
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
            Your premium social experience awaits. Connect, share, and explore in style.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95">
              Get Started
            </button>
            <button className="px-8 py-4 rounded-2xl bg-white dark:bg-[#0f1c2e] text-purple-600 dark:text-purple-400 font-semibold text-lg border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl">
              Learn More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-[#0a1628] dark:via-[#0f1c2e] dark:to-[#1a1f3a]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 xl:gap-8">
          
          <ProfileDash user={user} postsCount={userPostsCount} onEdit={handleEditProfile} />

          <main className="flex-1 min-w-0 space-y-6 max-w-4xl mx-auto xl:mx-0">
            
            {/* Tag Filter Banner */}
            {activeTagsArray.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl p-5 sm:p-6 border-2 border-purple-200/50 dark:border-purple-900/50 shadow-2xl"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        {activeTagsArray.length === 1 ? 'Filtering by tag' : `Filtering by ${activeTagsArray.length} tags`}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activeTagsArray.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        Showing {displayedPosts.length} of {allPosts.length} posts
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={clearFilter} 
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold text-sm hover:from-red-400 hover:to-pink-400 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Filter
                  </button>
                </div>
              </motion.div>
            )}

            {/* Create Post - ONLY SHOW WHEN NOT FILTERING */}
            {activeTagsArray.length === 0 && (
              <div className="animate-fadeIn">
                <CreatePost onCreated={onPostCreatedInline} />
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className="rounded-3xl bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-900/50 shadow-2xl overflow-hidden animate-pulse"
                  >
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 dark:from-blue-800 dark:to-purple-800"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-lg w-32"></div>
                          <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-lg w-20"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 rounded-lg w-full"></div>
                        <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-lg w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-3xl bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl border-2 border-red-200/50 dark:border-red-900/50 p-8 sm:p-12 text-center shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">Something went wrong</h3>
                <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
                <button 
                  onClick={() => load()} 
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Try Again
                </button>
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="rounded-3xl bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl border-2 border-purple-200/50 dark:border-purple-900/50 p-12 sm:p-16 text-center shadow-2xl">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/30">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {activeTagsArray.length > 0 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    )}
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
                  {activeTagsArray.length > 0 ? 'No posts found with these tags' : 'No posts yet'}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-lg mb-8">
                  {activeTagsArray.length > 0 
                    ? 'Try clearing the filter or searching for different tags'
                    : 'Be the first to share something amazing! ✨'
                  }
                </p>
                {activeTagsArray.length > 0 && (
                  <button 
                    onClick={clearFilter}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Clear Filter & View All Posts
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {displayedPosts.map((p) => (
                    <motion.div 
                      key={p._id || p.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PostCard post={p} onUpdate={() => load()} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
