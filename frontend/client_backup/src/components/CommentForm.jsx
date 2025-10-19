import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

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
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white select-none tracking-tight">
          Add a comment
        </h3>
        <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700 rounded-full" />
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {/* Floating background effect */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
        
        <div className={`relative rounded-2xl transition-all duration-500 ${
          isFocused 
            ? 'ring-4 ring-blue-500/30 ring-offset-2 dark:ring-offset-gray-900 transform scale-[1.02] shadow-2xl' 
            : 'shadow-lg hover:shadow-xl'
        }`}>
          {/* Main container */}
          <div className={`relative rounded-2xl bg-white dark:bg-gray-900 border-2 backdrop-blur-sm overflow-hidden ${
            isFocused 
              ? 'border-blue-400 dark:border-blue-600 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
            
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative p-4">
              <textarea
                placeholder="Share your thoughts..."
                value={text}
                onChange={e => { setText(e.target.value); setError(''); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={3}
                className="w-full bg-transparent resize-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white text-[15px] leading-relaxed font-medium transition-all duration-300"
                aria-label="Add a comment"
              />
            </div>

            {/* Bottom action bar */}
            <div className="relative flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/20">
              {/* Character count */}
              <motion.div 
                initial={false}
                animate={{ scale: text.length > 0 ? 1 : 0.9 }}
                className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <AnimatePresence mode="wait">
                  {text.length > 0 ? (
                    <motion.div
                      key="count"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-1.5 font-medium"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className={`font-semibold ${text.length > 200 ? 'text-orange-500' : 'text-gray-600 dark:text-gray-300'}`}>
                        {text.length}
                      </span>
                      <span className="text-gray-400">characters</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hint"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">Be kind and respectful</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit button */}
              <motion.button
                whileHover={{ 
                  scale: text.trim() ? 1.05 : 1,
                  y: text.trim() ? -1 : 0
                }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading || !text.trim()}
                className={`relative overflow-hidden group px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
                  text.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/25 hover:from-blue-500 hover:to-purple-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {/* Shimmer effect */}
                {text.trim() && (
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                )}
                
                <span className="relative flex items-center gap-2">
                  {loading ? (
                    <>
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
                      Posting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Post Comment
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>

      {/* Enhanced Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 border-l-4 border-red-500 dark:border-red-400 flex items-start gap-3 shadow-lg">
              <div className="w-5 h-5 rounded-full bg-red-500 dark:bg-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Unable to post comment</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">{error}</p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setError('')} 
                className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}