import React, { useState, useEffect, useRef, useContext } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%23e6eef8"/><text x="50%" y="50%" font-size="28" font-family="Helvetica, Arial, sans-serif" fill="%2334475a" text-anchor="middle" alignment-baseline="central">No image</text></svg>';

/**
 * EditProfile - Premium design for Luna
 * - Beautiful gradient background
 * - Image upload with live preview
 * - Fully responsive for mobile and desktop
 * - Smooth animations
 */

export default function EditProfile() {
  const { updateUser } = useContext(AuthContext);
  const { id } = useParams();
  const nav = useNavigate();

  const [form, setForm] = useState({ name: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(DEFAULT_AVATAR);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [mounted, setMounted] = useState(false);

  const objectUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper: normalize avatar URLs
  const normalizeAvatarUrl = (url, addTimestamp = false) => {
    if (!url) return DEFAULT_AVATAR;
    const isAbsolute = /^https?:\/\//i.test(url) || url.startsWith('//');
    const backend = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    let full = isAbsolute ? url : `${backend}${url}`;
    if (addTimestamp) {
      const sep = full.includes('?') ? '&' : '?';
      full = `${full}${sep}t=${Date.now()}`;
    }
    return full;
  };

  // Load existing user data
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        if (!isMounted) return;

        setForm({ name: res.data.name || '', bio: res.data.bio || '' });
        setPreview(normalizeAvatarUrl(res.data.avatarUrl, true));
      } catch (err) {
        console.error('Failed to load user:', err);
        setPreview(DEFAULT_AVATAR);
      }
    };
    loadUser();

    // Entrance animation
    const t = setTimeout(() => setMounted(true), 20);

    return () => { 
      isMounted = false;
      clearTimeout(t);
    };
  }, [id]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Handlers
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setError('');
    setSuccessMsg('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image is too large. Max size is 5MB.');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
    setAvatarFile(file);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAvatarFile(null);
    setRemoveAvatar(true);
    setPreview(DEFAULT_AVATAR);
    setError('');
    setSuccessMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => nav(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('bio', form.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (removeAvatar) formData.append('removeAvatar', true);

      const res = await API.put(`/users/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update AuthContext
      updateUser(res.data);

      // Trigger global event in case other components need updated user
      window.dispatchEvent(new CustomEvent('user:updated', { detail: res.data }));

      setSuccessMsg('Profile updated successfully!');
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        nav(`/profile/${id}`);
      }, 1000);
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#020817] dark:via-[#0a0e27] dark:to-[#0d1117] py-8 sm:py-12 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={handleCancel}
          className="mb-6 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Profile</span>
        </button>

        {/* Main Card */}
        <div
          className={`relative transform transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl blur-lg opacity-20"></div>
          
          {/* Card content */}
          <div className="relative bg-white/90 dark:bg-[#0a1628]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-purple-200/50 dark:border-purple-900/50 p-6 sm:p-8 md:p-10">
            
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
                    Edit Profile
                  </h1>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                    Update your display name, bio, and avatar
                  </p>
                </div>
              </div>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8" aria-describedby="form-status">
              
              {/* Avatar Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Profile Picture
                </h2>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border border-purple-200/30 dark:border-purple-800/30">
                  
                  {/* Avatar Preview */}
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 flex items-center justify-center border-4 border-white dark:border-[#0a1628] shadow-2xl ring-4 ring-purple-500/30 transition-all duration-300 group-hover:ring-purple-500/50 group-hover:scale-105">
                      <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
                    </div>
                    {/* Camera overlay on hover */}
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">Choose Image</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">PNG, JPG or GIF. Maximum 5MB.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Upload button */}
                      <label className="flex-1 cursor-pointer">
                        <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm text-center shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Photo
                        </div>
                        <input
                          ref={fileInputRef}
                          id="avatar"
                          name="avatar"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          aria-label="Upload avatar"
                        />
                      </label>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#1a1f3a] text-red-600 dark:text-red-400 font-semibold text-sm border-2 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Display Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-[#07142a]/50 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              {/* Bio Field */}
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={5}
                  className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-[#07142a]/50 backdrop-blur-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Write a short description about yourself
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 p-[2px] transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none group"
                >
                  <div className="relative px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-purple-600 transition-all duration-300">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    
                    <div className="relative flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base">
                      {loading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25"/>
                            <path d="M22 12a10 10 0 00-10-10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-[#1a1f3a] text-neutral-700 dark:text-neutral-200 font-semibold text-sm sm:text-base border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>

              {/* Status Messages */}
              <div id="form-status" aria-live="polite" className="min-h-[1.5rem]">
                {error && (
                  <div className="p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 animate-fadeIn">
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 sm:p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 animate-fadeIn">
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {successMsg}
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
