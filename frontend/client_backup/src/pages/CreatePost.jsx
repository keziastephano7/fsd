import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../api';
import { AuthContext } from '../AuthContext';

/**
 * CreatePost (Luna-styled)
 * - Improved UX and accessibility:
 *   - Image preview + remove
 *   - File validation (type + 5MB max)
 *   - Character limit and live count
 *   - Clearer, prominent gradient Post button
 *   - Disabled when nothing to post
 *   - Accessible status messages (aria-live)
 *
 * Props:
 * - onCreated(post) optional callback invoked with created post returned from API
 */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_CHAR = 1000; // comfortable limit for captions

export default function CreatePost({ onCreated }) {
  const { user } = useContext(AuthContext);

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const previewRef = useRef(null);

  // Clear inputs when user logs out
  useEffect(() => {
    if (!user) {
      setCaption('');
      setFile(null);
      setPreviewUrl('');
      setError('');
      setFieldErrors({});
    }
  }, [user]);

  // create object URL for preview and clean up
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      previewRef.current = url;
      return () => {
        if (previewRef.current) {
          URL.revokeObjectURL(previewRef.current);
          previewRef.current = null;
        }
      };
    } else {
      setPreviewUrl('');
    }
  }, [file]);

  const handleFileChange = (e) => {
    setError('');
    setFieldErrors({});
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }

    if (!f.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, gif).');
      return;
    }

    if (f.size > MAX_IMAGE_BYTES) {
      setError('Image too large. Max size is 5MB.');
      return;
    }

    setFile(f);
  };

  const removeImage = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setFile(null);
    setPreviewUrl('');
  };

  const canSubmit = () => {
    const hasContent = caption.trim().length > 0 || file !== null;
    return user && hasContent && !submitting;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!user) {
      setError('You must be logged in to post.');
      return;
    }

    if (!canSubmit()) {
      setError('Write something or attach an image to post.');
      return;
    }

    if (caption.length > MAX_CHAR) {
      setFieldErrors({ caption: `Caption exceeds ${MAX_CHAR} characters` });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption.trim());
      if (file) fd.append('image', file);

      // Let axios set Content-Type for FormData
      const res = await API.post('/posts', fd);
      const created = res.data;

      // Reset local state
      setCaption('');
      removeImage();

      // Notify parent (feed page or create page wrapper)
      onCreated && onCreated(created);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => { if (x.param) map[x.param] = x.msg; });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Error creating post. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto p-4 bg-white dark:bg-[#041028] rounded-2xl shadow-md border border-neutral-100 dark:border-neutral-800" aria-live="polite" noValidate>
      <div className="flex gap-3">
        {/* User avatar */}
        <div className="shrink-0">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`${user.name || 'User'} avatar`}
              className="w-11 h-11 rounded-full object-cover ring-1 ring-neutral-100 dark:ring-neutral-800"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        <div className="flex-1">
          <label htmlFor="caption" className="sr-only">Create a post</label>
          <textarea
            id="caption"
            name="caption"
            placeholder="Share something with Luna..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={MAX_CHAR}
            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-[#07142a] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#6b46ff] text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400"
            aria-invalid={!!fieldErrors.caption}
            aria-describedby={fieldErrors.caption ? 'caption-error' : 'caption-help'}
            data-createpost-input
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* File input */}
              <label htmlFor="post-image" className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-800">
                <svg className="w-4 h-4 text-[#6b46ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M16 3v4M8 3v4M3 11h18" /></svg>
                <span className="text-xs">Photo</span>
                <input id="post-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* optional other actions (tags etc) */}
              <button type="button" className="hidden md:inline-flex items-center px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-200">
                # Tag
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mr-2">{caption.length}/{MAX_CHAR}</div>

              <button
                type="submit"
                disabled={!canSubmit()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#6b46ff] ${
                  canSubmit()
                    ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] shadow-lg'
                    : 'opacity-60 cursor-not-allowed bg-neutral-300 dark:bg-neutral-800 text-neutral-400'
                }`}
                aria-disabled={!canSubmit()}
              >
                {submitting ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>
                ) : null}
                <span className="text-sm font-medium">{submitting ? 'Posting...' : 'Post'}</span>
              </button>
            </div>
          </div>

          {/* Errors and helper text */}
          <div className="mt-2">
            {fieldErrors.caption && <p id="caption-error" className="text-sm text-red-500">{fieldErrors.caption}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p id="caption-help" className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Be kind — Luna is for ages 12+</p>
          </div>

          {/* Image preview */}
          {previewUrl && (
            <div className="mt-3 relative">
              <img src={previewUrl} alt="Selected preview" className="w-full max-h-64 object-cover rounded-md border border-neutral-200 dark:border-neutral-800" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/75"
                aria-label="Remove image"
              >
                ✕
              </button>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Preview — {Math.round((file?.size || 0) / 1024)} KB</div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}