import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TagChip({ tag, size = "md" }) {
  if (!tag) return null;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1 rounded-lg",
    md: "px-3.5 py-1.5 text-sm gap-1.5 rounded-xl",
    lg: "px-4 py-2 text-base gap-2 rounded-2xl"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <motion.div
      whileHover={{ 
        scale: 1.08,
        y: -1
      }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 17 
      }}
      className="inline-block"
    >
      <Link
        to={`/tag/${encodeURIComponent(tag)}`}
        className={`
          inline-flex items-center
          ${sizeClasses[size]}
          bg-gradient-to-br from-blue-50 to-purple-50 
          dark:from-blue-950/40 dark:to-purple-950/40
          border border-blue-200/60 dark:border-blue-700/40
          text-blue-700 dark:text-blue-300
          hover:from-blue-100 hover:to-purple-100 
          dark:hover:from-blue-900/50 dark:hover:to-purple-900/50
          hover:border-blue-300/80 dark:hover:border-blue-600/60
          hover:text-blue-800 dark:hover:text-blue-200
          hover:shadow-lg
          shadow-md
          transition-all duration-300 
          focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:ring-offset-1
          font-semibold tracking-wide
        `}
        aria-label={`View posts tagged ${tag}`}
        role="link"
        tabIndex={0}
      >
        <motion.svg 
          className={`${iconSizes[size]} text-blue-600 dark:text-blue-400`}
          fill="currentColor" 
          viewBox="0 0 20 20" 
          aria-hidden="true" 
          focusable="false"
          whileHover={{ rotate: 15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </motion.svg>
        <span className="whitespace-nowrap font-medium">
          {tag}
        </span>
      </Link>
    </motion.div>
  );
}