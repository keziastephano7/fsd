import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { motion } from 'framer-motion';
import API from '../api'; // Use your API instance

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!EMAIL_REGEX.test(formData.email)) {
        console.log(formData.email);
        setError('Please enter a valid email');
        return false;
      }
      if (formData.password.length < MIN_PASSWORD_LENGTH) {
        setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
        return false;
      }
      // Use your existing API structure
      const res = await API.post('/auth/login', { 
        email: formData.email.trim(), 
        password: formData.password 
      });
      
      // Use the same response structure as your working code
      login(res.data.user, res.data.token);
      navigate('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const errorMap = {};
        data.errors.forEach(x => { if (x.param) errorMap[x.param] = x.msg; });
        setError(Object.values(errorMap).join(', '));
      } else {
        setError(data?.message || 'Login failed. Check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Full Screen Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800"></div>
        
        {/* Animated Stars */}
        <div className="absolute inset-0">
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        {/* Enhanced Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -30, 0], 
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl"
        />
        
        <motion.div
          animate={{ 
            y: [0, 20, 0], 
            opacity: [0.4, 0.7, 0.4],
            scale: [1.1, 1, 1.1]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 right-8 w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl"
        />

        {/* Additional Floating Orb */}
        <motion.div
          animate={{ 
            y: [20, -10, 20], 
            opacity: [0.2, 0.5, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 right-1/4 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-2xl"
        />
      </div>

      {/* Your Existing Content - Only changed the outer container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center items-center min-h-[80vh]"
          >
            <div className="w-full max-w-md mx-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, type: "spring", stiffness: 100, damping: 15 }}
                  className="flex justify-center mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 w-20 h-20 bg-yellow-200/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full shadow-2xl shadow-yellow-300/50 flex items-center justify-center border-2 border-yellow-300/40">
                      <svg 
                        className="w-8 h-8 text-amber-800"
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                <h2 className="text-3xl font-bold text-center text-white mb-2 font-outfit bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-center text-white/80 mb-8 font-outfit text-lg">
                  Sign in to your Luna account
                </p>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                    {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2 font-outfit">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-outfit backdrop-blur-sm"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2 font-outfit">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-outfit backdrop-blur-sm"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed font-outfit shadow-lg shadow-blue-500/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-white/70 font-outfit">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup" 
                      className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors duration-200 hover:underline"
                    >
                      Create Account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;