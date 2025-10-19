import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import EditPost from './EditPost';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import TagChip from './TagChip';

export default function PostCard({ post, onUpdate, disableMenu = false }) {
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { user } = useContext(AuthContext);
  const meId = user?.id || user?._id;

  useEffect(() => {
    setLiked(post.liked ?? (Array.isArray(post.likes) && post.likes.includes(meId)));
    setLikes(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  }, [post, meId]);

  useEffect(() => {
    API.get(`/posts/${post._id}/comments`)
      .then(r => setCommentsCount(r.data.length))
      .catch(console.error);
  }, [post._id]);

  const toggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const prev = liked;
    setLiked(!prev);
    setLikes(prevCount => prev ? prevCount - 1 : prevCount + 1);
    try {
      const r = await API.post(`/posts/${post._id}/like`);
      const updated = r.data;
      setLiked(updated.liked ?? updated._liked ?? liked);
      setLikes(Array.isArray(updated.likes) ? updated.likes.length : (updated.likes ?? likes));
      const broadcast = updated._id || updated.id
        ? updated
        : { ...(post || {}), likes: Array.isArray(updated.likes) ? updated.likes.length : (updated.likes ?? likes), _id: post._id || post.id, liked: updated.liked ?? updated._liked };
      window.dispatchEvent(new CustomEvent('post:updated', { detail: broadcast }));
      onUpdate?.();
    } catch (err) {
      setLiked(prev);
      setLikes(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
      console.error('Like failed', err);
    } finally {
      setIsLiking(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    await API.delete(`/posts/${post._id}`);
    window.dispatchEvent(new CustomEvent('post:deleted', { detail: { postId: post._id } }));
    onUpdate?.();
  };

  const isAuthor = String(post.author?._id) === String(meId);
  const avatar = post.author?.avatarUrl && buildUrl(post.author.avatarUrl);
  const authorLink = `/profile/${post.author?._id}`;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden hover:shadow-purple-600/30 hover:scale-[1.01] transform transition-transform duration-300 w-full max-w-[420px] mx-auto"
      >
        {/* Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 relative">
          <Link to={authorLink} className="flex items-center gap-3 flex-1">
            {avatar ? (
              <img src={avatar} alt={`${post.author?.name || 'User'} avatar`} className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-white font-bold text-base select-none ring-2 ring-purple-500">
                {post.author?.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{post.author?.name || 'User'}</p>
              <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleString()}
              </time>
            </div>
          </Link>

          {!disableMenu && isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Post options"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="6" cy="10" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="14" cy="10" r="1.5" />
                </svg>
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 overflow-hidden z-10"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setEditing(true);
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        deletePost();
                      }}
                      className="block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Image - smaller square container */}
        {post.imageUrl && (
          <div className="w-full bg-black">
            <div className="relative w-full" style={{ paddingTop: '100%' }}>
              <img
                src={buildUrl(post.imageUrl)}
                alt={post.caption || 'Post image'}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-6">
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              <svg
                className={`w-6 h-6 ${liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                fill={liked ? 'currentColor' : 'none'}
                stroke={liked ? 'none' : 'currentColor'}
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{ transition: 'fill 0.3s ease, stroke 0.3s ease, color 0.3s ease' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={liked ? 0 : 2}
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 
                    12.28 2 8.5 2 5.42 4.42 3 7.5 
                    3c1.74 0 3.41.81 4.5 2.09C13.09 
                    3.81 14.76 3 16.5 3 19.58 3 22 
                    5.42 22 8.5c0 3.78-3.4 6.86-8.55 
                    11.54L12 21.35z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-semibold select-none text-sm">{likes}</span>
            </button>

            <button
              onClick={() => setShowComments(s => !s)}
              aria-expanded={showComments}
              aria-controls={`comments-section-${post._id}`}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 
                    12c0 4.418-4.03 8-9 8a9.863 
                    9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 
                    15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 
                    3.582 9 8z" />
              </svg>
              <span className="text-gray-700 dark:text-gray-400 font-semibold select-none text-sm">{commentsCount}</span>
            </button>
          </div>

          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words select-text text-sm">{post.caption}</p>

          <div className="flex flex-wrap gap-1">
            {post.tags?.map((t, i) => (
              <TagChip key={i} tag={t} />
            ))}
          </div>

          {!showComments && commentsCount > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-xs text-gray-500 hover:underline"
              aria-label={`View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`}
            >
              View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              id={`comments-section-${post._id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-3xl"
            >
              <CommentList postId={post._id} />
              <CommentForm
                postId={post._id}
                onAdded={() => {
                  setCommentsCount(c => {
                    const newCount = c + 1;
                    const broadcast = { ...(post || {}), _id: post._id || post.id, commentsCount: newCount };
                    window.dispatchEvent(new CustomEvent('post:updated', { detail: broadcast }));
                    onUpdate?.();
                    return newCount;
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit modal */}
        {editing && (
          <EditPost
            post={post}
            onClose={() => setEditing(false)}
            onSaved={onUpdate}
          />
        )}
      </motion.article>
    </>
  );
}
