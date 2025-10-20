import React, { useEffect, useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import OnlineStatus from '../components/OnlineStatus';
import { useTheme } from '../ThemeContext';

export default function Profile() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme(); // Get theme state
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [hoveredPost, setHoveredPost] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await API.get(`/users/${id}`, { signal: controller.signal });
        if (!mountedRef.current) return;
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        if (mountedRef.current) setLoadingProfile(false);
      }
    };

    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await API.get(`/posts?author=${id}`, { signal: controller.signal });
        if (!mountedRef.current) return;
        setPosts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load posts', err);
      } finally {
        if (mountedRef.current) setLoadingPosts(false);
      }
    };

    loadProfile();
    loadPosts();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [id]);

  // Handle post updates for synchronization
  useEffect(() => {
    const onPostUpdated = (e) => {
      const updated = e.detail;
      if (!updated) return;
      const pid = updated._id || updated.id;
      if (!pid) return;
      
      // Update the post with the new data
      setPosts(prev => prev.map(p => {
        if ((p._id || p.id) === pid) {
          return { ...p, ...updated };
        }
        return p;
      }));
    };

    window.addEventListener('post:updated', onPostUpdated);
    return () => window.removeEventListener('post:updated', onPostUpdated);
  }, []);

  const isOwner = !!user && (String(user.id || user._id) === String(id));
  const thoughts = posts.filter(p => !p.imageUrl);
  const mediaPosts = posts.filter(p => p.imageUrl);

  // Safe likes array check
  const getLikesArray = (post) => {
    if (!post.likes) return [];
    if (Array.isArray(post.likes)) return post.likes;
    return [];
  };

  // Handle like for thoughts - FIXED SYNC ISSUE
  const handleThoughtLike = async (thoughtId) => {
    try {
      // Optimistic update first
      const thought = posts.find(p => (p._id || p.id) === thoughtId);
      if (!thought) return;

      const currentLikes = getLikesArray(thought);
      const userId = user?.id || user?._id;
      const isCurrentlyLiked = currentLikes.some(likeId => 
        String(likeId) === String(userId)
      );

      // Optimistically update UI
      setPosts(prev => prev.map(p => {
        if ((p._id || p.id) === thoughtId) {
          if (isCurrentlyLiked) {
            // Remove like optimistically
            return { 
              ...p, 
              likes: currentLikes.filter(likeId => String(likeId) !== String(userId))
            };
          } else {
            // Add like optimistically
            return { 
              ...p, 
              likes: [...currentLikes, userId]
            };
          }
        }
        return p;
      }));

      // Make API call
      const res = await API.post(`/posts/${thoughtId}/like`);
      const responseData = res.data;

      // Since backend only returns count, we need to refetch the post to get updated likes array
      try {
        const updatedPostRes = await API.get(`/posts/${thoughtId}`);
        const updatedPost = updatedPostRes.data;
        
        // Update with actual data from backend
        setPosts(prev => prev.map(p => {
          if ((p._id || p.id) === thoughtId) {
            return { ...p, likes: updatedPost.likes || [] };
          }
          return p;
        }));

        // Dispatch event for synchronization with Feed
        window.dispatchEvent(new CustomEvent('post:updated', { 
          detail: { 
            ...updatedPost,
            _id: thoughtId, 
            id: thoughtId
          }
        }));

      } catch (fetchError) {
        console.error('Failed to fetch updated post:', fetchError);
        // If refetch fails, at least we have the optimistic update
      }

    } catch (err) {
      console.error('Failed to like thought:', err);
      
      // Revert optimistic update on error
      setPosts(prev => prev.map(p => {
        if ((p._id || p.id) === thoughtId) {
          const originalThought = posts.find(post => (post._id || post.id) === thoughtId);
          return { ...p, likes: getLikesArray(originalThought) };
        }
        return p;
      }));
    }
  };

  // iOS-style Edit Profile Button
  const EditProfileButton = () => (
    <motion.button
      onClick={() => navigate(`/profile/${id}/edit`)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-5 py-2.5 rounded-2xl font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm"
    >
      Edit Profile
    </motion.button>
  );

  // Instagram-style Post Grid Item
  const PostGridItem = ({ post, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden group cursor-pointer"
      onMouseEnter={() => setHoveredPost(post._id || post.id)}
      onMouseLeave={() => setHoveredPost(null)}
    >
      {post.imageUrl && (
        <img
          src={buildUrl(post.imageUrl)}
          alt={post.caption || 'Post image'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      
      {/* Instagram-style Hover Overlay */}
      <AnimatePresence>
        {(hoveredPost === (post._id || post.id)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <div className="flex items-center gap-6 text-white">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span className="font-semibold">{getLikesArray(post).length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-semibold">{post.comments?.length || 0}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // iOS-style Thought Card with user profile and synchronized likes
  const ThoughtCard = ({ thought, index }) => {
    const likesArray = getLikesArray(thought);
    const isLiked = likesArray.some(likeId => String(likeId) === String(user?.id || user?._id));
    
    return (
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer mb-3"
      >
        <div className="flex gap-3">
          {/* User Avatar with Online Status */}
          <div className="flex-shrink-0 relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm relative">
              {profile?.avatarUrl ? (
                <img
                  src={buildUrl(profile.avatarUrl)}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                String(profile?.name || 'U').charAt(0).toUpperCase()
              )}
            </div>
            {/* Online Status Badge */}
            <OnlineStatus 
              userId={id} 
              size="sm" 
              align="bottom-right"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* User Info */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">
                {profile?.name || 'User'}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                @{profile?.username || profile?.email?.split('@')[0] || 'user'}
              </span>
            </div>

            {/* Thought Content */}
            <p className="text-gray-900 dark:text-gray-100 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
              {thought.caption || thought.content}
            </p>

            {/* Engagement Metrics */}
            <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleThoughtLike(thought._id || thought.id);
                }}
                className={`flex items-center gap-1 group transition-colors ${
                  isLiked ? 'text-red-500' : 'hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={`p-1 rounded-full transition-colors ${
                    isLiked ? 'bg-red-100 dark:bg-red-900/30' : 'group-hover:bg-red-50 dark:group-hover:bg-red-900/20'
                  }`}
                >
                  <svg 
                    className="w-4 h-4" 
                    fill={isLiked ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.div>
                <span className={`text-xs ${isLiked ? 'text-red-500' : ''}`}>
                  {likesArray.length || 0}
                </span>
              </button>

              <button className="flex items-center gap-1 group hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                <div className="p-1 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-xs">{thought.comments?.length || 0}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Profile Header with iOS-style rounded corners */}
      <div className="bg-white dark:bg-gray-800">
        {/* Banner - Dynamic based on theme */}
        <div className={`h-48 rounded-b-3xl transition-all duration-500 ${
          isDark 
            ? 'bg-gradient-to-r from-gray-900 to-gray-700' 
            : 'bg-gradient-to-r from-purple-500 to-pink-300'
        }`} />
        
        {/* Profile Info Card */}
        <div className="px-6 pb-8 -mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar with Online Indicator */}
              <div className="relative -mt-20 sm:-mt-24">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg overflow-hidden relative">
                  {loadingProfile ? (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  ) : profile?.avatarUrl ? (
                    <img
                      src={buildUrl(profile.avatarUrl)}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                      {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
                
                {/* Online Status Badge */}
                <div className="absolute bottom-1 right-0">
                  <OnlineStatus 
                    userId={id} 
                    size="lg" 
                    align="bottom-right"
                  />
                </div>
              </div>

              {/* User Info - Clean single bio display */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loadingProfile ? (
                        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                      ) : (
                        profile?.name || 'Unnamed User'
                      )}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {loadingProfile ? (
                        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                      ) : (
                        `@${profile?.username || profile?.email?.split('@')[0] || 'user'}`
                      )}
                    </p>
                  </div>
                  
                  {isOwner && (
                    <div className="mt-3 sm:mt-0">
                      <EditProfileButton />
                    </div>
                  )}
                </div>

                {/* Single Bio Display */}
                <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-[15px]">
                  {loadingProfile ? (
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                  ) : (
                    profile?.bio || 'No bio yet'
                  )}
                </p>

                {/* Stats with iOS-style rounded corners */}
                <div className="flex items-center gap-6 text-sm pt-2">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{mediaPosts.length}</span>
                    <span className="text-gray-600 dark:text-gray-400">posts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{profile?.followers?.length || 0}</span>
                    <span className="text-gray-600 dark:text-gray-400">followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white">{thoughts.length}</span>
                    <span className="text-gray-600 dark:text-gray-400">thoughts</span>
                  </div>
                </div>

                {!isOwner && (
                  <div className="flex gap-3 pt-2">
                    <button className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm">
                      Follow
                    </button>
                    <button className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-2xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs with iOS-style rounded corners */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-1 mb-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-8 py-3 font-medium text-sm rounded-2xl transition-colors flex-1 text-center ${
              activeTab === 'posts'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            POSTS
          </button>
          <button
            onClick={() => setActiveTab('thoughts')}
            className={`px-8 py-3 font-medium text-sm rounded-2xl transition-colors flex-1 text-center ${
              activeTab === 'thoughts'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            THOUGHTS
          </button>
        </div>

        {/* Content */}
        <div className="pb-8">
          {activeTab === 'posts' ? (
            loadingPosts ? (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : mediaPosts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Posts Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">When you share photos, they'll appear here.</p>
                {isOwner && (
                  <Link to="/" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                    Share your first photo
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {mediaPosts.map((post, index) => (
                  <PostGridItem key={post._id || post.id} post={post} index={index} />
                ))}
              </div>
            )
          ) : (
            <div className="max-w-2xl mx-auto">
              {loadingPosts ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : thoughts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Thoughts Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Share your thoughts with the community.</p>
                  {isOwner && (
                    <Link to="/" className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                      Share your first thought
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {thoughts.map((thought, index) => (
                    <ThoughtCard key={thought._id || thought.id} thought={thought} index={index} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}