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
import OnlineStatus from '../components/OnlineStatus';

export default function PostCard({ post, onUpdate, disableMenu = false, isModal, showCommentsDefault = false }) {
  const [showComments, setShowComments] = useState(showCommentsDefault);
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  const [liked, setLiked] = useState(false);
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

  // Format time to dd/mm/yyyy and hh:mm am/pm
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Format date as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time as hh:mm am/pm (local time without seconds)
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    
    return `${day}/${month}/${year} ${time}`;
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 w-full
          ${isModal ? "max-w-lg mx-auto" : "max-w-2xl mx-auto"} hover:shadow-xl dark:hover:shadow-gray-900/50`}
      >
        {/* Header - Enhanced Design */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <Link to={authorLink} className="flex items-center gap-3 flex-1 min-w-0 group">
            <div className="relative">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={`${post.author?.name || 'User'} avatar`} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-300" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm select-none ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-300 dark:group-hover:ring-blue-500 transition-all duration-300">
                  {post.author?.name?.charAt(0) || '?'}
                </div>
              )}
              {/* Online Status Badge */}
              <OnlineStatus 
                userId={post.author?._id} 
                size="sm" 
                align="bottom-right"
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {post.author?.name || 'User'}
              </p>
              <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={post.createdAt}>
                {formatTime(post.createdAt)}
              </time>
            </div>
          </Link>
          
          {!disableMenu && isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(m => !m)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Post options"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="6" cy="10" r="1.5" />
                  <circle cx="10" cy="10" r="1.5" />
                  <circle cx="14" cy="10" r="1.5" />
                </svg>
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[120px] overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setEditing(true);
                      }}
                      className="block w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        deletePost();
                      }}
                      className="block w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Image Section - Enhanced */}
        {post.imageUrl && (
          <div className="w-full bg-gray-50 dark:bg-gray-900">
            <div className="relative w-full" style={{ paddingTop: '75%' }}>
              <img
                src={buildUrl(post.imageUrl)}
                alt={post.caption || 'Post image'}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Content Section - Enhanced */}
        <div className="p-4 space-y-3">
          {/* Engagement Buttons - Modern Design */}
          <div className="flex items-center gap-6">
            <motion.button
              onClick={toggleLike}
              disabled={isLiking}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-200 ${
                liked 
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              aria-pressed={liked}
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              <svg
                className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={liked ? 0 : 2}
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
              <span className={`font-semibold text-sm ${liked ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {likes}
              </span>
            </motion.button>

            <motion.button
              onClick={() => setShowComments(s => !s)}
              whileTap={{ scale: 0.95 }}
              aria-expanded={showComments}
              aria-controls={`comments-section-${post._id}`}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-200 ${
                showComments 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className={`font-semibold text-sm ${showComments ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {commentsCount}
              </span>
            </motion.button>
          </div>

          {/* Caption - Enhanced Typography */}
          {post.caption && (
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words select-text text-[15px] leading-relaxed">
              {post.caption}
            </p>
          )}

          {/* Tags - Enhanced */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map((t, i) => (
                <TagChip key={i} tag={t} />
              ))}
            </div>
          )}

          {/* View Comments Prompt */}
          {!showComments && commentsCount > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              aria-label={`View all ${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`}
            >
              View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>

        {/* Comments Section - Enhanced */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              id={`comments-section-${post._id}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            >
              <div className="p-4">
                <CommentList postId={post._id} key={commentsVersion} />
                <CommentForm
                  postId={post._id}
                  onAdded={() => {
                    setCommentsCount(c => {
                      const newCount = c + 1;
                      setCommentsVersion(v => v + 1);
                      const broadcast = { ...(post || {}), _id: post._id || post.id, commentsCount: newCount };
                      window.dispatchEvent(new CustomEvent('post:updated', { detail: broadcast }));
                      onUpdate?.();
                      return newCount;
                    });
                  }}
                />
              </div>
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

      {/* Enhanced Delete Confirmation Modal */}
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
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center z-50"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4a3 3 0 016 0v2M10 11v6m4-6v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                </svg>
              </div>
              <h2 className="text-center text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Post?</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove this post? This action cannot be undone.
              </p>
              {deleteError && (
                <div className="mb-4 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                  {deleteError}
                </div>
              )}
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={reallyDelete}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold hover:from-red-600 hover:to-pink-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70"
              onClick={() => setConfirmingDelete(false)}
              style={{ zIndex: 40 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}