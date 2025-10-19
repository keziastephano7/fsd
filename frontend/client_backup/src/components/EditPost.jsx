import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { buildUrl } from '../utils/url';
import { parseTags } from '../utils/tags';

export default function EditPost({ post, onSaved, onClose }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(post.imageUrl ? buildUrl(post.imageUrl) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  const [tags, setTags] = useState(post.tags || []);
  const [tagInput, setTagInput] = useState('');

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const tagInputRef = useRef(null);

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
    }
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('Image is too large (max 5 MB).');
      return;
    }
    setFile(selected);
    setRemoveImage(false);
    setError('');
  };

  const handleRemoveImage = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setFile(null);
    setPreviewUrl('');
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = (raw) => {
    if (!raw) return;
    const t = raw.trim().toLowerCase().replace(/^#/, '');
    if (!t) return;
    setTags(prev => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput('');
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val) addTag(val);
    } else if (e.key === 'Backspace' && !tagInput) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const parsed = parseTags(caption || '');
      const merged = [...tags];
      for (const t of parsed) if (!merged.includes(t)) merged.push(t);

      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);
      if (removeImage) fd.append('removeImage', 'true');
      if (merged.length) fd.append('tags', JSON.stringify(merged));
      await API.put(`/posts/${post._id || post.id}`, fd);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 14 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-purple-200/50 dark:border-purple-900/50 bg-white dark:bg-[#132042] overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-post-title"
        >
          <div className="sticky top-0 z-10 px-4 py-4 bg-white/95 dark:bg-[#132042]/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h2 id="edit-post-title" className="text-lg font-bold text-neutral-900 dark:text-white">
                  Edit Post
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 select-none">
                  Update your content & tags
                </p>
              </div>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Close edit post modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {/* Caption */}
            <div className="space-y-1">
              <label htmlFor="caption" className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 select-none">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Caption
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Edit your caption..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#171c38] border border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 text-sm text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition"
                aria-label="Edit caption"
              />
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 select-none">
                #hashtags supported
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 select-none">
                <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Tags
              </h3>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5" role="list" aria-label="Post tags">
                  {tags.map(t => (
                    <motion.span
                      key={t}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 border border-purple-200 dark:border-purple-800/50 text-xs"
                      role="listitem"
                    >
                      <span className="text-purple-700 dark:text-purple-300 select-none">#{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-purple-500 hover:text-purple-700 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-300 rounded"
                        aria-label={`Remove tag ${t}`}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-purple-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/15 text-xs transition"
                  aria-label="Add tags"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim()) addTag(tagInput);
                    tagInputRef.current?.focus();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 border border-purple-200 dark:border-purple-800 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-purple-300 transition"
                  aria-label="Add tag"
                >+
                </button>
              </div>
            </div>
            {/* Image Section */}
            <div>
              {previewUrl && (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Post preview"
                    className="w-full max-h-56 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700 shadow"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-blue-300"
                      aria-label="Change image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow transition-all hover:scale-105 focus:outline-none focus:ring-1 focus:ring-red-300"
                      aria-label="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload new image"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-dashed border-neutral-300 dark:border-neutral-600 hover:border-purple-400 dark:hover:border-purple-600 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition flex items-center justify-center gap-2 select-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {previewUrl ? 'Change Image' : 'Add Image'}
                </button>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-2 text-center select-none">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -7 }}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800/30">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 relative overflow-hidden px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 hover:from-blue-500 hover:via-purple-500 hover:to-purple-600 text-white font-semibold shadow hover:shadow-purple-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed group focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600"></div>
                <span className="relative flex items-center justify-center gap-2 select-none">
                  {loading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.22" />
                        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </span>
              </motion.button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#191f37] text-neutral-700 dark:text-neutral-200 font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition hover:scale-105 active:scale-95 shadow disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
