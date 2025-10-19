import React, { useState, useRef, useEffect, useContext } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * Login (Luna)
 * - Premium animated gradient background
 * - Glass-morphism design
 * - Smooth entrance animations
 * - Clear validation and error handling
 */

export default function Login() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const emailRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    // Clear form when component mounts
    setForm({ email: '', password: '' });
    setFieldErrors({});
    setFormError('');
    emailRef.current?.focus();

    // Entrance animation
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.email.trim()) errors.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Password is required.';
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email: form.email.trim(), password: form.password });
      login(res.data.user, res.data.token);
      nav('/', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => { if (x.param) map[x.param] = x.msg; });
        setFieldErrors(map);
      } else {
        setFormError(data?.message || 'Login failed. Check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Animated Background - Multiple Gradient Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#020817] dark:via-[#0a0e27] dark:to-[#0d1117]">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Gradient mesh overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>
      </div>

      {/* Floating particles/stars effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 dark:bg-purple-300 rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          ></div>
        ))}
      </div>

      {/* Login Card - Glass morphism design */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
        role="region"
        aria-labelledby="login-heading"
      >
        {/* Glow effect behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        
        {/* Main card */}
        <div className="relative bg-white/80 dark:bg-[#0a1628]/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-200/50 dark:border-purple-900/50 p-8 sm:p-10">
          
          {/* Header with Luna branding */}
          <header className="mb-8 text-center">
            {/* Logo/Icon with gradient */}
            <div className="mx-auto mb-5 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 shadow-2xl shadow-purple-500/50 relative group">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-75 group-hover:scale-110 transition-transform duration-300 animate-pulse"></div>
              
              {/* Moon icon */}
              <svg className="w-10 h-10 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </div>

            <h1 id="login-heading" className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
              Welcome to Luna
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">Sign in to your account</p>
          </header>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate autoComplete="off">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  required
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white/50 dark:bg-[#07142a]/50 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 transition-all duration-300 ${
                    fieldErrors.email 
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  required
                  className={`w-full pl-12 pr-14 py-3 rounded-xl border-2 bg-white/50 dark:bg-[#07142a]/50 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 transition-all duration-300 ${
                    fieldErrors.password 
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 px-2 py-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 animate-fadeIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 p-[2px] transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <div className="relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-purple-600 transition-all duration-300">
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  <div className="relative flex items-center justify-center gap-2 text-white font-semibold">
                    {loading && (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    )}
                    <span>{loading ? 'Signing in...' : 'Sign in to Luna'}</span>
                  </div>
                </div>
              </button>
            </div>
          </form>

          {/* Form Error Message */}
          <div id="login-status" aria-live="polite" className="min-h-[1.5rem] mt-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 animate-fadeIn">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {formError}
                </p>
              </div>
            )}
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-purple-500 transition-all duration-300"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
