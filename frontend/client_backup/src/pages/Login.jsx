import React, { useState, useRef, useEffect, useContext } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

/**
 * Login
 * - Clears form on mount to avoid showing old typed values
 * - Uses controlled inputs and autoComplete hints off
 */
export default function Login() {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    // Clear form when component mounts so previous typed values aren't remembered
    setForm({ email: '', password: '' });
    setFieldErrors({});
    setFormError('');
    emailRef.current?.focus();
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
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-[#07142a] rounded-xl shadow-card border border-neutral-100 dark:border-neutral-800">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Welcome back</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Sign in to continue</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate autoComplete="off">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Email</label>
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
            className="mt-1 w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          {fieldErrors.email && <p id="email-error" className="text-sm text-red-500 mt-1">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Password</label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              required
              className="w-full px-4 py-2 pr-12 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-[#052033]">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {fieldErrors.password && <p id="password-error" className="text-sm text-red-500 mt-1">{fieldErrors.password}</p>}
        </div>

        <div>
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <div id="login-status" aria-live="polite" className="min-h-[1.25rem] mt-3">
        {formError && <p className="text-sm text-red-500 text-center">{formError}</p>}
      </div>

      <div className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Don't have an account? <Link to="/signup" className="text-primary-600 hover:underline">Sign up</Link>
      </div>
    </div>
  );
}