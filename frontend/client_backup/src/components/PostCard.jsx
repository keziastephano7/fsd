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

export default function PostCard({ post, onUpdate, disableMenu = false, isModal, showCommentsDefault = false  }) {
  // const [showComments, setShowComments] = useState(showCommentsDefault);
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { user } = useContext(AuthContext);
  const meId = user?.id || user?._id;

  useEffect(() => {
    if (showCommentsDefault) setShowComments(true);
  }, [showCommentsDefault]);

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
    setLikes(prevCount => (prev ? prevCount - 1 : prevCount + 1));
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

  const deletePost = () => {
    setDeleteError('');
    setConfirmingDelete(true);
  };

  const reallyDelete = async () => {
    setDeleteError('');
    setConfirmingDelete(false);
    try {
      await API.delete(`/posts/${post._id}`);
      window.dispatchEvent(new CustomEvent('post:deleted', { detail: { postId: post._id } }));
      onUpdate?.();
    } catch (err) {
      setDeleteError('Failed to delete post. Please try again.');
    }
  };

  const isAuthor = String(post.author?._id) === String(meId);
  const avatar = post.author?.avatarUrl && buildUrl(post.author.avatarUrl);
  const authorLink = `/profile/${post.author?._id}`;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`bg-white dark:bg-[#191e33] rounded-xl shadow-lg overflow-hidden transition-all duration-250 w-full
          ${isModal ? "max-w-lg mx-auto" : "max-w-sm mx-auto"}`}
      >
        {/* Header */}
        <div className="flex items-center p-3 border-b border-neutral-200 dark:border-[#263054] relative">
          <Link to={authorLink} className="flex items-center gap-2 flex-1 min-w-0">
            {avatar ? (
              <img src={avatar} alt={`${post.author?.name || 'User'} avatar`} className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-400/70" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm select-none ring-2 ring-purple-400/70">
                {post.author?.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900 dark:text-white text-xs truncate">{post.author?.name || 'User'}</p>
              <time className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate" dateTime={post.createdAt}>
                {new Date(post.createdAt).toLocaleString()}
              </time>
            </div>
          </Link>
          {!disableMenu && isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Post options"
              >
                <svg className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="6" cy="10" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="14" cy="10" r="1.5" />
                </svg>
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    className="absolute right-0 mt-2 bg-white dark:bg-[#222849] rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-10 min-w-[112px]"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setEditing(true);
                      }}
                      className="block w-full px-3 py-2 text-xs text-left hover:bg-purple-50 dark:hover:bg-[#312d59] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        deletePost();
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950 text-red-600 dark:text-red-400 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {post.imageUrl && (
          <div className="w-full bg-neutral-800">
            <div className="relative w-full" style={{ paddingTop: '100%' }}>
              <img
                src={buildUrl(post.imageUrl)}
                alt={post.caption || 'Post image'}
                className="absolute inset-0 w-full h-full object-cover rounded-b-md"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-5">
            <button
              onClick={toggleLike}
              disabled={isLiking}
              className="flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              <svg
                className={`w-5 h-5 ${liked ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`}
                fill={liked ? 'currentColor' : 'none'}
                stroke={liked ? 'none' : 'currentColor'}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={liked ? 0 : 2}
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
              <span className="text-neutral-700 dark:text-neutral-300 font-semibold select-none text-xs">{likes}</span>
            </button>
            <button
              onClick={() => setShowComments(s => !s)}
              aria-expanded={showComments}
              aria-controls={`comments-section-${post._id}`}
              className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-neutral-700 dark:text-neutral-400 font-semibold text-xs">{commentsCount}</span>
            </button>
          </div>
          <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap break-words select-text text-sm">{post.caption}</p>
          <div className="flex flex-wrap gap-1">
            {post.tags?.map((t, i) => (
              <TagChip key={i} tag={t} />
            ))}
          </div>
          {!showComments && commentsCount > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-xs text-neutral-500 hover:underline"
              aria-label={`View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`}
            >
              View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              id={`comments-section-${post._id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-3 border-t border-neutral-200 dark:border-[#263054] bg-neutral-50 dark:bg-[#181d32] rounded-b-xl"
            >
              <CommentList postId={post._id} key={commentsVersion} />
              <CommentForm
                postId={post._id}
                onAdded={() => {
                  setCommentsCount(c => {
                    const newCount = c + 1;
                    setCommentsVersion(v => v + 1); // Refresh comments list
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
        {editing && (
          <EditPost
            post={post}
            onClose={() => setEditing(false)}
            onSaved={onUpdate}
          />
        )}
      </motion.article>

      {/* Luna/Figma styled confirmation modal, with non-blurred backdrop */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
          >
            {/* The modal dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-md w-full bg-white dark:bg-[#192048] rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-700 p-6 flex flex-col items-center z-50"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18M9 6V4a3 3 0 016 0v2M10 11v6m4-6v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                </svg>
              </div>
              <h2 className="text-center text-xl font-bold text-purple-800 dark:text-purple-100 mb-3">Delete Post?</h2>
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-6">
                Are you sure you want to remove this post? This action cannot be undone.
              </p>
              {deleteError && (
                <div className="mb-4 px-3 py-2 rounded bg-red-100 text-red-700 text-xs dark:bg-red-900 dark:text-red-300">
                  {deleteError}
                </div>
              )}
              <div className="flex w-full gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={reallyDelete}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-800 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
            {/* NON-blur semi-transparent backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setConfirmingDelete(false)}
              style={{ zIndex: 40 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
