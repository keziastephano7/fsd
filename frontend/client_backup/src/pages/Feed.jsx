import React, { useEffect, useState, useCallback, useContext } from 'react';
import API from '../api';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

/**
 * Feed
 * - Hydrates posts whose author is an id with current user's info (if it matches)
 * - Listens to 'user:updated' and merges updated user info into posts authored by that user
 */

function ProfileDash({ user, postsCount, onEdit }) {
  if (!user) return null;
  return (
    <aside className="hidden lg:flex lg:flex-col w-72 shrink-0">
      <div className="sticky top-20 p-4 rounded-xl bg-white dark:bg-[#07142a] shadow-soft border border-neutral-100 dark:border-neutral-800">
        <div className="flex flex-col items-center gap-3">
          {user.avatarUrl ? (
            <img src={buildUrl(user.avatarUrl)} alt="You" className="w-24 h-24 rounded-full object-cover border-2 border-primary-600" />
          ) : (
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center text-3xl text-neutral-500">{user.name?.charAt(0)}</div>
          )}
          <div className="text-center">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{user.bio || 'No bio yet'}</div>
          </div>

          <div className="w-full mt-3">
            <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <div className="text-center">
                <div className="font-semibold">{postsCount}</div>
                <div className="text-xs text-neutral-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{user.followers?.length ?? '-'}</div>
                <div className="text-xs text-neutral-500">Followers</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={onEdit} className="flex-1 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">Edit profile</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function Feed() {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // helper: hydrate author info for posts returned by API
  const hydratePostsWithCurrentUser = useCallback((rawPosts = []) => {
    if (!user) return rawPosts;
    return rawPosts.map(p => {
      // if author is a primitive id (string/number), replace with current user when matches
      const authorId = p.author?._id || p.author || p.authorId;
      if ((typeof p.author === 'string' || typeof p.author === 'number') && String(p.author) === String(user.id)) {
        return { ...p, author: { ...(user || {}), id: user.id, _id: user.id } };
      }

      if (p.author && typeof p.author === 'object') {
        // if author object refers to current user, merge latest fields
        const aId = p.author._id || p.author.id || null;
        if (String(aId) === String(user.id)) {
          return { ...p, author: { ...p.author, ...(user || {}) } };
        }
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
      setPosts(hydrated);
    } catch (err) {
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

  // when a new post is created elsewhere, prepend it
  useEffect(() => {
    const onPostCreated = (e) => {
      const newPost = e.detail;
      if (!newPost) return;
      // if newPost.author is an id and matches current user, hydrate it
      let hydrated = newPost;
      const authorId = newPost.author?._id || newPost.author || newPost.authorId;
      if ((typeof newPost.author === 'string' || typeof newPost.author === 'number') && String(authorId) === String(user?.id)) {
        hydrated = { ...newPost, author: { ...(user || {}), id: user.id, _id: user.id } };
      } else if (newPost.author && typeof newPost.author === 'object' && String((newPost.author._id || newPost.author.id)) === String(user?.id)) {
        hydrated = { ...newPost, author: { ...newPost.author, ...(user || {}) } };
      }
      setPosts(prev => [hydrated, ...prev]);
    };
    window.addEventListener('post:created', onPostCreated);
    return () => window.removeEventListener('post:created', onPostCreated);
  }, [user]);

  // when a user is updated, merge updated info into posts authored by that user
  useEffect(() => {
    const onUserUpdated = (e) => {
      const updated = e.detail || {};
      const updatedId = updated.id || updated._id || updated.userId || null;
      if (!updatedId) return;

      setPosts(prev => prev.map(p => {
        const authorId = p.author?._id || p.author || p.authorId;
        if (String(authorId) === String(updatedId)) {
          // merge author details
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

  const onPostCreatedInline = (newPost) => {
    // hydrate new post author if necessary
    const authorId = newPost.author?._id || newPost.author || newPost.authorId;
    let hydrated = newPost;
    if ((typeof newPost.author === 'string' || typeof newPost.author === 'number') && String(authorId) === String(user?.id)) {
      hydrated = { ...newPost, author: { ...(user || {}), id: user.id, _id: user.id } };
    }
    setPosts(prev => [hydrated, ...prev]);
    navigate('/', { replace: true });
  };

  const handleEditProfile = () => {
    if (!user) return;
    navigate(`/profile/${user.id}/edit`);
  };

  // compute number of posts authored by the current user
  const userPostsCount = posts.filter(p => {
    const authorId = p.author?._id || p.author || p.authorId;
    return String(authorId) === String(user?.id || user?._id);
  }).length;

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center px-4">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Welcome!</h2>
        <p className="text-neutral-600 dark:text-neutral-400">Log in or sign up to see and create posts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-6 px-4 gap-6 grid grid-cols-1 lg:grid-cols-[auto_1fr]">
      <ProfileDash user={user} postsCount={userPostsCount} onEdit={handleEditProfile} />

      <main className="flex-1 flex flex-col gap-6">
        {/* Create composer at top of feed */}
        <div>
          <CreatePost onCreated={onPostCreatedInline} />
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-[#07142a] rounded-xl shadow-soft border border-neutral-100 dark:border-neutral-800 animate-pulse h-36" />
            <div className="p-4 bg-white dark:bg-[#07142a] rounded-xl shadow-soft border border-neutral-100 dark:border-neutral-800 animate-pulse h-36" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button onClick={() => load()} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Retry</button>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400 text-center mt-10 text-lg">No posts yet — start by creating one!</p>
        ) : (
          <div className="space-y-6">
            {posts.map(p => (
              <PostCard key={p._id || p.id} post={p} onUpdate={() => load()} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}