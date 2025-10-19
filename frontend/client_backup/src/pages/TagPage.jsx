import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Feed from './Feed';

/**
 * TagPage - Premium Tag Filter Page
 * - Beautiful header with tag info
 * - Clear navigation
 * - Filtered feed display
 */

export default function TagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();

  if (!tag) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-[#0a1628] dark:via-[#0f1c2e] dark:to-[#1a1f3a]">
      {/* Premium Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-xl border-b-2 border-purple-200/50 dark:border-purple-900/50 shadow-xl"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            
            {/* Left side - Tag info */}
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
                  #{tag}
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                  Discover posts tagged with <span className="font-semibold">#{tag}</span>
                </p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-[#1a1f3a] text-neutral-700 dark:text-neutral-300 font-semibold text-sm border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                View All Posts
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feed with tag filter */}
      <Feed tagFilter={tag} />
    </div>
  );
}
