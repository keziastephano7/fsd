import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { buildUrl } from '../utils/url';

export default function CommentList({ postId, initial = [], onRemoved }) {
  const [comments, setComments] = useState(initial);
  const [loading, setLoading] = useState(!initial.length);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null); // Modal state
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Load comments error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [postId]);

  const openDeleteModal = (commentId) => {
    setDeleteError('');
    setPendingDeleteCommentId(commentId);
  };

  const closeDeleteModal = () => setPendingDeleteCommentId(null);

  const confirmRemove = async () => {
    if (!pendingDeleteCommentId) return;
    setDeletingId(pendingDeleteCommentId);
    setDeleteError('');
    try {
      await API.delete(`/posts/${postId}/comments/${pendingDeleteCommentId}`);
      setComments(prev => prev.filter(c => c._id !== pendingDeleteCommentId));
      onRemoved && onRemoved(pendingDeleteCommentId);
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Cannot delete comment');
      setDeletingId(null);
    }
  };

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id
    || JSON.parse(localStorage.getItem('user') || '{}')._id;

  if (loading) {
    return (
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-neutral-300 dark:bg-neutral-700 rounded w-28"></div>
                <div className="h-2.5 bg-neutral-300 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-2.5 bg-neutral-300 dark:bg-neutral-700 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!comments.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-purple-200 dark:border-purple-800/50 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          No comments yet
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Be the first to share your thoughts! 💭
        </p>
      </motion.div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 select-none">
          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path fillRule="evenodd"
              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
              clipRule="evenodd" />
          </svg>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-200 via-blue-200 to-transparent dark:from-purple-900 dark:via-blue-900 dark:to-transparent rounded-full" />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => {
            const isOwner = String(comment.author?._id || comment.author) === String(currentUserId);
            const isDeleting = deletingId === comment._id;

            return (
              <motion.div
                key={comment._id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80, scale: 0.9 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f1c2e] border-2 border-neutral-200 dark:border-neutral-700/50 hover:border-purple-300 dark:hover:border-purple-700/50 shadow-md hover:shadow-lg transition-all duration-300 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="shrink-0">
                    {comment.author?.avatarUrl ? (
                      <img
                        src={buildUrl(comment.author.avatarUrl)}
                        alt={comment.author?.name || 'User'}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-purple-500/30"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-purple-500/30 select-none">
                        {(comment.author?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate select-text">
                          {comment.author?.name || 'Anonymous User'}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 select-none">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {isOwner && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openDeleteModal(comment._id)}
                          disabled={isDeleting}
                          className="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          {isDeleting ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </motion.button>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap break-words select-text">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm dialog for comment delete */}
      <AnimatePresence>
        {pendingDeleteCommentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-modal="true"
            role="dialog"
          >
            {/* Dialog content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-sm w-full bg-white dark:bg-[#192048] rounded-2xl shadow-2xl border border-purple-200 dark:border-purple-700 p-6 flex flex-col items-center z-50"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18M9 6V4a3 3 0 016 0v2M10 11v6m4-6v6M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                </svg>
              </div>
              <h2 className="text-center text-base font-bold text-purple-800 dark:text-purple-100 mb-1">
                Delete Comment?
              </h2>
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                Are you sure you want to delete this comment? This cannot be undone.
              </p>
              {deleteError && (
                <div className="mb-3 px-3 py-2 rounded bg-red-100 text-red-700 text-xs dark:bg-red-900 dark:text-red-300">
                  {deleteError}
                </div>
              )}
              <div className="flex w-full gap-3 justify-center">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRemove}
                  disabled={deletingId === pendingDeleteCommentId}
                  className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-purple-800 transition flex items-center justify-center"
                >
                  {deletingId === pendingDeleteCommentId ? (
                    <svg className="w-5 h-5 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  ) : null}
                  Delete
                </button>
              </div>
            </motion.div>
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={closeDeleteModal}
              style={{ zIndex: 40 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
