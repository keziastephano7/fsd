import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Feed from './Feed';

export default function TagPage() {
  const { tag } = useParams();
  const navigate = useNavigate();

  if (!tag) {
    navigate('/');
    return null;
  }

  // Soft floating animation for background elements
  const floatingBackground = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Gentle stagger for children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom ease for smoothness
      }
    }
  };

  // Soft float up animation
  const floatUpVariants = {
    hidden: { 
      opacity: 0, 
      y: 40,
      scale: 0.95 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 20,
        mass: 1,
        duration: 1.2
      }
    }
  };

  // Gentle slide in from sides
  const slideInVariants = {
    hidden: { 
      opacity: 0, 
      x: -30,
      filter: "blur(10px)" 
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 25,
        duration: 1
      }
    }
  };

  // Soft scale and fade
  const scaleFadeVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotateX: 10 
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 60,
        damping: 20,
        duration: 1.4
      }
    }
  };

  // Gentle button interactions
  const buttonVariants = {
    initial: { 
      scale: 1,
      y: 0 
    },
    hover: { 
      scale: 1.02,
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
        duration: 0.3
      }
    },
    tap: { 
      scale: 0.98,
      y: 1 
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/10 dark:from-[#0a1628] dark:via-[#0f1c2e] dark:to-[#1a1f3a] relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <motion.div
        variants={floatingBackground}
        animate="animate"
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/10 to-purple-200/10 rounded-full blur-3xl"
      />
      <motion.div
        variants={floatingBackground}
        animate="animate"
        transition={{ delay: 2 }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-200/5 to-pink-200/5 rounded-full blur-3xl"
      />
      <motion.div
        variants={floatingBackground}
        animate="animate"
        transition={{ delay: 4 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-100/5 to-pink-100/5 rounded-full blur-3xl"
      />

      {/* Enhanced Premium Header */}
      <motion.div
        variants={containerVariants}
        className="relative bg-white/80 dark:bg-[#0f1c2e]/80 backdrop-blur-2xl border-b border-blue-200/20 dark:border-purple-900/20 shadow-2xl shadow-blue-500/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            variants={containerVariants}
            className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
          >
            
            {/* Tag Information */}
            <motion.div 
              variants={slideInVariants}
              className="flex items-center gap-4 sm:gap-6"
            >
              <motion.div
                variants={scaleFadeVariants}
                className="relative"
                whileHover={{ 
                  scale: 1.05,
                  rotate: [0, -5, 5, 0],
                  transition: { 
                    rotate: { duration: 0.6, ease: "easeInOut" },
                    scale: { duration: 0.3 }
                  }
                }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 relative z-10">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-lg"
                />
              </motion.div>

              <motion.div 
                variants={floatUpVariants}
                className="space-y-2"
              >
                <motion.h1 
                  className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                >
                  #{tag}
                </motion.h1>
                <motion.p 
                  className="text-sm text-gray-600 dark:text-gray-400 font-medium"
                  whileHover={{ 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  Explore community posts tagged with <span className="font-bold text-purple-600 dark:text-purple-400">#{tag}</span>
                </motion.p>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              variants={slideInVariants}
              className="flex items-center gap-3"
            >
              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-xl bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 font-semibold text-sm border-2 border-gray-300/50 dark:border-gray-600/50 hover:border-blue-300 dark:hover:border-blue-600 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 group"
              >
                <motion.svg
                  whileHover={{ x: -3 }}
                  className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </motion.svg>
                Back
              </motion.button>

              <motion.button
                variants={buttonVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-sm shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-2 group relative overflow-hidden"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
                <motion.svg
                  whileHover={{ rotate: 90 }}
                  className="w-5 h-5 relative z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
                <span className="relative z-10">All Posts</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            variants={floatUpVariants}
            className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              {[
                { icon: "📝", text: "Posts tagged" },
                { icon: "💬", text: "Community discussions" },
                { icon: "🚀", text: "Trending content" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-2"
                  whileHover={{ 
                    scale: 1.05,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Feed Section with soft entrance */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: 1.2,
          duration: 1,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="py-8 relative z-10"
      >
        <Feed tagFilter={tag} />
      </motion.div>

      {/* Subtle floating particles */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 right-1/4 w-4 h-4 bg-blue-400/20 rounded-full blur-sm"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-purple-400/20 rounded-full blur-sm"
      />
      <motion.div
        animate={{
          y: [0, -10, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-2/3 right-1/2 w-2 h-2 bg-pink-400/20 rounded-full blur-sm"
      />
    </motion.div>
  );
}