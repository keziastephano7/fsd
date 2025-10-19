import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * TagChip - Premium Luna Design
 * - Beautiful gradient styling
 * - Smooth hover animations
 * - Always visible, clickable to filter
 */

export default function TagChip({ tag }) {
  if (!tag) return null;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-block"
    >
      <Link
        to={`/tag/${encodeURIComponent(tag)}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 border-2 border-purple-200/50 dark:border-purple-800/50 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
        aria-label={`View posts tagged ${tag}`}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        {tag}
      </Link>
    </motion.div>
  );
}
