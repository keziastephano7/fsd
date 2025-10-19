import React, { useEffect, useState, useContext, useRef } from 'react';
import API from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

export default function Profile() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'thoughts'
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

  useEffect(() => {
    const onPostCreated = (e) => {
      const newPost = e.detail;
      if (!newPost) return;
      const authorId = newPost.author?._id || newPost.author || newPost.authorId;
      if (String(authorId) === String(id)) {
        setPosts(prev => {
          if (prev.some(p => (p._id || p.id) === (newPost._id || newPost.id))) return prev;
          return [newPost, ...prev];
        });
      }
    };
    window.addEventListener('post:created', onPostCreated);
    return () => window.removeEventListener('post:created', onPostCreated);
  }, [id]);

  useEffect(() => {
    const onUserUpdated = (e) => {
      const updated = e.detail || {};
      const updatedId = updated.id || updated._id || null;
      if (!updatedId) return;
      if (String(updatedId) === String(id)) {
        API.get(`/users/${id}`).then(res => setProfile(res.data)).catch(() => {});
      }
    };
    window.addEventListener('user:updated', onUserUpdated);
    return () => window.removeEventListener('user:updated', onUserUpdated);
  }, [id]);

  useEffect(() => {
    const onPostUpdated = (e) => {
      const updated = e.detail;
      if (!updated) return;
      const pid = updated._id || updated.id;
      if (!pid) return;
      setPosts(prev => prev.map(p => ((p._id || p.id) === pid ? { ...p, ...updated } : p)));
    };
    window.addEventListener('post:updated', onPostUpdated);
    return () => window.removeEventListener('post:updated', onPostUpdated);
  }, []);

  const isOwner = !!user && (String(user.id || user._id) === String(id));
  const handleEdit = () => navigate(`/profile/${id}/edit`);

  const thoughts = posts.filter(p => !p.imageUrl);
  const mediaPosts = posts.filter(p => p.imageUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/20 to-blue-50/20 dark:from-[#050b14] dark:via-[#0a1628] dark:to-[#0d1b2a] pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Profile Header */}
        <div className="relative mb-8 animate-fadeIn">
          <div className="h-48 sm:h-56 rounded-t-3xl bg-[radial-gradient(600px_180px_at_10%_20%,rgba(139,92,246,0.18),transparent),linear-gradient(135deg,#5b8def,#8b5cf6)] relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent animate-shimmer mix-blend-overlay"></div>
            <div className="absolute -left-12 -top-8 w-48 h-48 rounded-full bg-white/6 blur-3xl animate-pulse-slow"></div>
          </div>

          <div className="bg-white dark:bg-[#0a1628] rounded-b-3xl shadow-2xl border-x border-b border-purple-100/50 dark:border-purple-900/30 px-6 sm:px-8 pb-8 relative">
            {isOwner && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Edit Profile
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-20">
              <div className="relative group">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-white dark:border-[#0a1628] shadow-2xl ring-4 ring-purple-500/30 transition-all duration-300 group-hover:ring-purple-500/60 group-hover:scale-105">
                  {loadingProfile ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 animate-pulse"></div>
                  ) : profile?.avatarUrl ? (
                    <img
                      src={buildUrl(profile.avatarUrl)}
                      alt={`${profile.name || 'User'} avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-5xl">
                      {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                  )}
                </div>
                {isOwner && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-[#0a1628] shadow-lg" aria-label="Online indicator"></div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 tracking-tight">
                  {loadingProfile ? (
                    <span className="inline-block w-48 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></span>
                  ) : (
                    profile?.name || 'Unnamed User'
                  )}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400 max-w-md leading-relaxed">
                  {loadingProfile ? (
                    <span className="inline-block w-64 h-5 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"></span>
                  ) : (
                    profile?.bio || '✨ No bio yet — the mystery continues...'
                  )}
                </p>
              </div>

              {!isOwner && (
                <div className="flex gap-3 sm:mb-4">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2">
                    Follow
                  </button>
                  <Link
                    to={`/messages/${profile?._id || profile?.id || id}`}
                    className="px-6 py-2.5 rounded-xl bg-white dark:bg-[#1a1f3a] text-purple-600 dark:text-purple-400 font-semibold border-2 border-purple-300 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-md"
                  >
                    Message
                  </Link>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 max-w-md mx-auto sm:mx-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center sm:text-left p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {loadingPosts ? '...' : posts.length}
                  </div>
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1">Posts</div>
                </div>
                <div className="text-center sm:text-left p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200/50 dark:border-purple-800/30 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="font-bold text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {loadingProfile ? '...' : (profile?.followers?.length ?? 0)}
                  </div>
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1">Followers</div>
                </div>
                <div className="text-center sm:text-left p-4 rounded-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    {loadingPosts ? '...' : thoughts.length}
                  </div>
                  <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1">Thoughts</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-[#0a1628] rounded-2xl shadow-xl border border-purple-100/50 dark:border-purple-900/30 p-2 inline-flex gap-2 justify-center max-w-md mx-auto sm:mx-0">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'posts'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
              }`}
              aria-selected={activeTab === 'posts'}
              role="tab"
            >
              Posts
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'posts'
                    ? 'bg-white/20'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {mediaPosts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('thoughts')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'thoughts'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/50'
              }`}
              aria-selected={activeTab === 'thoughts'}
              role="tab"
            >
              Thoughts
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'thoughts'
                    ? 'bg-white/20'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {thoughts.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {activeTab === 'posts' ? (
            loadingPosts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
            ) : mediaPosts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white dark:bg-[#0a1628] rounded-3xl border border-purple-100/50 dark:border-purple-900/30 shadow-xl">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {isOwner ? 'Share your first moment with images!' : 'No posts with images yet.'}
                </p>
                {isOwner && (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Create Post
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediaPosts.map((p, index) => (
                  <Link
                    key={p._id || p.id}
                    to={`/post/${p._id || p.id}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 animate-fadeInUp border-2 border-transparent hover:border-purple-400/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                    aria-label={p.caption ? p.caption.slice(0, 80) : 'Post'}
                  >
                    <img
                      src={buildUrl(p.imageUrl)}
                      alt={p.caption ? p.caption.slice(0, 80) : 'Post image'}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {p.caption && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm font-medium line-clamp-2">{p.caption}</p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )
          ) : activeTab === 'thoughts' ? (
            loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="h-32 rounded-2xl bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : thoughts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white dark:bg-[#0a1628] rounded-3xl border border-purple-100/50 dark:border-purple-900/30 shadow-xl">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No thoughts yet</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {isOwner ? 'Share your first thought!' : 'No thoughts shared yet.'}
                </p>
                {isOwner && (
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Share Thought
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {thoughts.map((t, index) => (
                  <article
                    key={t._id || t.id}
                    className="bg-white dark:bg-[#0a1628] rounded-2xl shadow-lg border border-purple-100/50 dark:border-purple-900/30 p-5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] animate-fadeInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {t.author?.avatarUrl ? (
                          <img
                            src={buildUrl(t.author.avatarUrl)}
                            alt={t.author?.name || 'Author'}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-purple-500/30">
                            {String(t.author?.name || t.author || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-900 dark:text-white select-text">
                            {t.author?.name || t.author || 'User'}
                          </span>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 select-none">
                            • {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed select-text">
                          {t.caption || t.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
