import React, { useState, useEffect, useRef, useContext } from 'react';
import API from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="%23e6eef8"/><text x="50%" y="50%" font-size="28" font-family="Helvetica, Arial, sans-serif" fill="%2334475a" text-anchor="middle" alignment-baseline="central">No image</text></svg>';

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

  const objectUrlRef = useRef(null);

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
    let mounted = true;
    const loadUser = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        if (!mounted) return;

        setForm({ name: res.data.name || '', bio: res.data.bio || '' });
        setPreview(normalizeAvatarUrl(res.data.avatarUrl, true));
      } catch (err) {
        console.error('Failed to load user:', err);
        setPreview(DEFAULT_AVATAR);
      }
    };
    loadUser();

    return () => { mounted = false; };
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
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
      nav(`/profile/${id}`);
    } catch (err) {
      console.error('Update failed:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-[#07142a] rounded-xl shadow-card border border-neutral-100 dark:border-neutral-800">
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Edit profile</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Update your display name, bio and avatar.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="form-status">
        {/* Avatar preview */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border-2 border-neutral-100 dark:border-neutral-800">
            <img src={preview} alt="avatar preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 w-full">
            <label htmlFor="avatar" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Avatar</label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">PNG, JPG or GIF. Max 5MB.</p>

            <div className="flex flex-wrap gap-2 items-center">
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-neutral-700 dark:text-neutral-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary-600 file:text-white cursor-pointer"
                aria-label="Upload avatar"
              />
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#052033]"
              >
                Remove avatar
              </button>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="mt-1 w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="A short bio about yourself"
            rows={4}
            className="mt-1 w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100 resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-[#052033]"
          >
            Cancel
          </button>
        </div>

        {/* Status messages */}
        <div id="form-status" aria-live="polite" className="min-h-[1.25rem]">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {successMsg && <p className="text-sm text-green-500">{successMsg}</p>}
        </div>
      </form>
    </div>
  );
}
