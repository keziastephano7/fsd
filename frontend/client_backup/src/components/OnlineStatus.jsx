import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { motion } from 'framer-motion';

export default function OnlineStatus({ userId, size = "md", showText = false, align = "bottom-right" }) {
  const { user } = useContext(AuthContext);
  
  // Simple logic: user is "online" if they are the current logged-in user
  const isOnline = !!user && (String(user.id || user._id) === String(userId));
  
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  const alignmentClasses = {
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-right": "top-0 right-0", 
    "top-left": "top-0 left-0"
  };

  return (
    <div className={`absolute ${alignmentClasses[align]} flex items-center gap-2`}>
      {showText && (
        <span className={`text-xs font-medium ${
          isOnline ? 'text-green-600' : 'text-gray-500'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`
          ${sizeClasses[size]} 
          rounded-full border-2 border-white dark:border-gray-800
          ${isOnline 
            ? 'bg-green-500 shadow-lg shadow-green-500/50' 
            : 'bg-gray-400'
          }
        `}
      >
        {isOnline && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full rounded-full bg-green-400"
          />
        )}
      </motion.div>
    </div>
  );
}