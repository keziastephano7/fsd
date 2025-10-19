import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

/**
 * CommentForm - Ultra Premium Luna Design
 * - Elite spacing and layout
 * - Beautiful gradient accents
 * - Professional micro-interactions
 * - Perfect color harmony with Luna theme
 * - Beginner-friendly with clear comments
 */

export default function CommentForm({ postId, onAdded }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) return setError('Comment cannot be empty');
    setError('');
    setLoading(true);

    try {
      const res = await API.post(`/posts/${postId}/comments`, { text });
      setText('');
      onAdded && onAdded(res.data);
    } catch (err) {
      console.error('Comment submit error', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to post comment';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Header with icon - Premium touch */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Add a comment
          </h3>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-purple-200 via-blue-200 to-transparent dark:from-purple-900 dark:via-blue-900 dark:to-transparent"></div>
      </div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Main comment container with premium styling */}
        <div className={`
          relative overflow-hidden rounded-2xl transition-all duration-300
          ${isFocused 
            ? 'ring-2 ring-purple-500 dark:ring-purple-400 ring-offset-2 dark:ring-offset-[#0a1628]' 
            : ''
          }
        `}>
          
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
          
          {/* Inner content with glass effect */}
          <div className={`
            relative bg-white dark:bg-[#0f1c2e] border-2 rounded-2xl
            transition-all duration-300 shadow-lg
            ${isFocused 
              ? 'border-purple-400 dark:border-purple-600 shadow-purple-500/20' 
              : 'border-neutral-200 dark:border-neutral-700/50 shadow-neutral-900/5'
            }
          `}>
            
            {/* Textarea wrapper with perfect padding */}
            <div className="p-4 sm:p-5">
              <textarea
                placeholder="💭 Share your thoughts..."
                value={text}
                onChange={e => {
                  setText(e.target.value);
                  setError('');
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={4}
                className="
                  w-full bg-transparent resize-none
                  text-neutral-900 dark:text-neutral-100
                  placeholder:text-neutral-400 dark:placeholder:text-neutral-500
                  focus:outline-none
                  text-sm sm:text-base leading-relaxed
                "
              />
            </div>

            {/* Bottom bar with actions and info */}
            <div className="px-4 sm:px-5 pb-4 flex items-center justify-between gap-4 border-t border-neutral-100 dark:border-neutral-800/50 pt-4">
              
              {/* Left side - Character count and hint */}
              <div className="flex items-center gap-3 flex-1">
                <AnimatePresence>
                  {text.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="font-medium">{text.length}</span>
                      <span className="opacity-60">characters</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!text.length && (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Be kind and respectful</span>
                  </p>
                )}
              </div>

              {/* Right side - Submit button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !text.trim()}
                className={`
                  relative overflow-hidden group
                  px-5 sm:px-6 py-2.5 rounded-xl
                  font-semibold text-sm
                  transition-all duration-300
                  ${text.trim() 
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white shadow-lg hover:shadow-purple-500/50 hover:from-blue-500 hover:via-purple-500 hover:to-purple-600' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                  }
                `}
              >
                {/* Shine effect on hover */}
                {text.trim() && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                )}
                
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Post Comment</span>
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Error message with elegant styling */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-l-4 border-red-500 dark:border-red-400">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-red-500 dark:bg-red-400 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Unable to post comment
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  </div>
                  <button
                    onClick={() => setError('')}
                    className="shrink-0 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </div>
  );
}
