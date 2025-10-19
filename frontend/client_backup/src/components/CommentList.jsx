import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { buildUrl } from '../utils/url';

export default function CommentList({ postId, initial = [], onRemoved }) {
  const [comments, setComments] = useState(initial);
  const [loading, setLoading] = useState(!initial.length);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);
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

  // Format time function
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    return `${day}/${month}/${year} ${time}`;
  };

  if (loading) {
    return (
      <div className="space-y-4 mt-6">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-300 dark:bg-gray-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded-lg w-32"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-lg w-24"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-lg w-full"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (!comments.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-6 p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-blue-200 dark:border-gray-600 text-center shadow-lg"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No comments yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Be the first to share your thoughts!
        </p>
        <div className="w-6 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
      </motion.div>
    );
  }

  return (
    <div className="mt-6">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h3>
        </div>
        <div className="flex-1 h-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600 rounded-full" />
      </motion.div>

      {/* Comments List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => {
            const isOwner = String(comment.author?._id || comment.author) === String(currentUserId);
            const isDeleting = deletingId === comment._id;

            return (
              <motion.div
                key={comment._id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.9 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                whileHover={{ 
                  y: -2,
                  transition: { duration: 0.2 }
                }}
                className={`group relative p-4 rounded-2xl bg-white dark:bg-gray-900 border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isDeleting ? 'opacity-50 pointer-events-none' : 
                  'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                }`}
              >
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {comment.author?.avatarUrl ? (
                      <img
                        src={buildUrl(comment.author.avatarUrl)}
                        alt={comment.author?.name || 'User'}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-blue-500/30 shadow-md">
                        {(comment.author?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-[15px] truncate">
                          {comment.author?.name || 'Anonymous User'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(comment.createdAt)}
                        </p>
                      </div>
                      
                      {/* Delete Button */}
                      {isOwner && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openDeleteModal(comment._id)}
                          disabled={isDeleting}
                          className="shrink-0 p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Delete comment"
                        >
                          {isDeleting ? (
                            <motion.svg 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4" 
                              viewBox="0 0 24 24" 
                              fill="none"
                            >
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                              <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </motion.svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </motion.button>
                      )}
                    </div>
                    
                    {/* Comment Text */}
                    <p className="text-[15px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words font-medium">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Enhanced Delete Confirmation Modal */}
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
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeDeleteModal}
            />
            
            {/* Dialog */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center z-50"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              {/* Content */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Delete Comment?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                This action cannot be undone. The comment will be permanently removed.
              </p>
              
              {deleteError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm w-full text-center"
                >
                  {deleteError}
                </motion.div>
              )}
              
              {/* Actions */}
              <div className="flex w-full gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={confirmRemove}
                  disabled={deletingId === pendingDeleteCommentId}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold hover:from-red-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {deletingId === pendingDeleteCommentId ? (
                    <motion.svg 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5" 
                      viewBox="0 0 24 24" 
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </motion.svg>
                  ) : null}
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}