import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enhanced background with harmonious colors */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800"></div>
        
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
        
        {/* Animated stars with better contrast */}
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>

        {/* Floating celestial elements with harmonious colors */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl"
        />
        
        <motion.div
          animate={{
            y: [0, 15, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-32 right-8 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"
        />

        {/* Additional floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              animate={{
                y: [0, -30, 0],
                x: [0, 10, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content container with smooth edges */}
      <div className="max-w-6xl mx-auto text-center relative z-10 py-16 rounded-sm">
        {/* Enhanced Moon Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 1.2, 
            type: "spring",
            stiffness: 100,
            damping: 15
          }}
          className="mb-12 flex justify-center"
        >
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 w-28 h-28 bg-yellow-200/30 rounded-full blur-xl animate-pulse"></div>
            
            {/* Main moon */}
            <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-2xl shadow-yellow-300/50 flex items-center justify-center border-2 border-yellow-300/40">
              {/* Perfect moon SVG without clipped edges */}
              <svg 
                className="w-14 h-14 text-amber-800"
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              
              {/* Subtle inner shadow for depth */}
              <div className="absolute inset-0 rounded-full shadow-inner shadow-yellow-400/30"></div>
            </div>
          </div>
        </motion.div>

        {/* Main heading with smooth text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 font-outfit tracking-tight bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
            Luna
          </h1>
        </motion.div>

        {/* Subtitle with better readability */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-xl md:text-2xl text-gray-100 mb-12 max-w-3xl mx-auto leading-relaxed font-outfit font-light tracking-wide"
        >
          Connect with friends and share your experiences in our space.
        </motion.p>

        {/* Enhanced Action buttons with harmonious colors */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-5 justify-center items-center"
        >
          <Link
            to="/login"
            className="group relative overflow-hidden bg-white/15 backdrop-blur-lg border border-white/25 rounded-2xl px-10 py-4 text-lg font-semibold text-white transition-all duration-500 hover:bg-white/25 hover:scale-105 hover:shadow-2xl w-full sm:w-auto text-center min-w-[180px]"
          >
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 transform translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              Sign In
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>

          <Link
            to="/signup"
            className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl px-10 py-4 text-lg font-semibold text-white transition-all duration-500 hover:from-cyan-600 hover:to-blue-700 hover:scale-105 hover:shadow-2xl w-full sm:w-auto text-center min-w-[180px] shadow-lg shadow-blue-500/25"
          >
            {/* Enhanced shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 transform translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
            <span className="relative flex items-center justify-center gap-2">
              Create Account
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
          </Link>
        </motion.div>


        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="mt-16 text-white/60 text-sm font-outfit"
        >
          Join us & sharing your stories on Luna 🤍
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;