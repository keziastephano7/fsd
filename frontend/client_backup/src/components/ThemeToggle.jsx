import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeContext';

export default function ThemeToggle({ size = "md" }) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "w-10 h-6",
    md: "w-12 h-7",
    lg: "w-14 h-8"
  };

  const knobSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${sizeClasses[size]}
        relative rounded-full p-1 transition-all duration-300
        ${isDark 
          ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
          : 'bg-gradient-to-r from-amber-300 to-orange-400'
        }
        shadow-lg hover:shadow-xl
        border border-opacity-20
        ${isDark ? 'border-purple-300' : 'border-amber-200'}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{
          x: isDark ? 
            size === 'sm' ? 16 : 
            size === 'md' ? 20 : 24 
            : 0,
          rotate: isDark ? 180 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        className={`
          ${knobSizes[size]}
          rounded-full bg-white shadow-lg
          flex items-center justify-center
          transition-all duration-300
        `}
      >
        {/* Sun/Moon Icons */}
        {isDark ? (
          // Moon icon
          <motion.svg
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-3 h-3 text-purple-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </motion.svg>
        ) : (
          // Sun icon
          <motion.svg
            initial={{ scale: 0, rotate: 90 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-3 h-3 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </motion.svg>
        )}
      </motion.div>

      {/* Stars for dark mode */}
      {isDark && (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="absolute top-3 left-3 w-0.5 h-0.5 bg-white rounded-full"
          />
        </>
      )}
    </motion.button>
  );
}