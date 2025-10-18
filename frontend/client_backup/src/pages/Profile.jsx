import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import API from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

export default function Profile() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const mountedRef = useRef(true);

  const loadProfile = useCallback(async (signal) => {
    setLoadingProfile(true);
    try {
      const res = await API.get(`/users/${id}`, { signal });
      if (!mountedRef.current) return;
      setProfile(res.data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to load profile:', err);
    } finally {
      if (mountedRef.current) setLoadingProfile(false);
    }
  }, [id]);

  const loadPosts = useCallback(async (signal) => {
    setLoadingPosts(true);
    try {
      const res = await API.get(`/posts?author=${id}`, { signal });
      if (!mountedRef.current) return;
      setPosts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Failed to load posts:', err);
    } finally {
      if (mountedRef.current) setLoadingPosts(false);
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    loadProfile(controller.signal);
    loadPosts(controller.signal);
    return () => { mountedRef.current = false; controller.abort(); };
  }, [loadProfile, loadPosts]);

  useEffect(() => {
    const handler = (e) => {
      const newPost = e.detail;
      if (!newPost) return;
      const authorId = newPost.author?._id || newPost.author || newPost.authorId;
      if (String(authorId) === String(id)) {
        setPosts(prev => [newPost, ...prev]);
      }
    };
    window.addEventListener('post:created', handler);
    return () => window.removeEventListener('post:created', handler);
  }, [id]);

  useEffect(() => {
    const onUserUpdated = (e) => {
      const detail = e.detail || {};
      if (detail.id) {
        if (String(detail.id) === String(id)) {
          const controller = new AbortController();
          loadProfile(controller.signal);
        }
      } else {
        if (user && String(user.id || user._id) === String(id)) {
          const controller = new AbortController();
          loadProfile(controller.signal);
        }
      }
    };
    window.addEventListener('user:updated', onUserUpdated);
    return () => window.removeEventListener('user:updated', onUserUpdated);
  }, [id, loadProfile, user]);

  const isOwner = !!user && (String(user.id || user._id) === String(id) || String(user.id || user._id) === String(profile?._id || profile?.id));

  if (loadingProfile) return <p className="text-center mt-20 text-neutral-600 dark:text-neutral-400">Loading...</p>;
  if (!profile) return <p className="text-center mt-20 text-neutral-600 dark:text-neutral-400">Profile not found.</p>;

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4 flex flex-col lg:flex-row gap-6">
      <div className="lg:w-1/3 flex flex-col items-center bg-white dark:bg-[#07142a] rounded-xl shadow-soft border border-neutral-100 dark:border-neutral-800 p-6">
        {profile.avatarUrl ? (
          <img
            src={buildUrl(profile.avatarUrl)}
            alt="avatar"
            className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-primary-600"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-32 h-32 bg-neutral-100 dark:bg-neutral-900 rounded-full mb-4 flex items-center justify-center text-xl text-neutral-500">
            {profile.name?.charAt(0) ?? '?'}
          </div>
        )}

        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{profile.name}</h2>
        {profile.bio && <p className="text-neutral-600 dark:text-neutral-400 text-center mb-4">{profile.bio}</p>}

        <div className="flex gap-2 mt-2 w-full">
          {isOwner ? (
            <button onClick={() => navigate(`/profile/${id}/edit`)} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg">✏️ Edit Profile</button>
          ) : (
            <>
              <button onClick={() => navigate(`/create?author=${id}`)} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg">+ Add Post</button>
              <Link to={`/messages/${profile._id || profile.id || id}`} className="mt-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200">Message</Link>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Posts</h3>

        {posts.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400 text-center mt-4">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {posts.map((pt) => (
              <div key={pt._id || pt.id} className="bg-white dark:bg-[#07142a] rounded-xl shadow-soft border border-neutral-100 dark:border-neutral-800 p-4 hover:shadow-md transition">
                {pt.imageUrl && (
                  <Link to={`/post/${pt._id || pt.id}`}>
                    <img src={buildUrl(pt.imageUrl)} alt={pt.caption ? pt.caption.slice(0, 80) : 'Post image'} className="w-full h-44 object-cover rounded-md mb-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  </Link>
                )}
                <p className="text-neutral-700 dark:text-neutral-100">{pt.caption}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}