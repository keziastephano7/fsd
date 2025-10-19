import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { buildUrl } from '../utils/url';
import { parseTags } from '../utils/tags';

/**
 * EditPost - Premium Modal Design for Luna
 * - Edit caption, image, AND tags
 * - Beautiful modal overlay with backdrop blur
 * - Enhanced image preview and editing
 * - Tag management with add/remove
 * - Smooth animations and transitions
 */

export default function EditPost({ post, onSaved, onClose }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(post.imageUrl ? buildUrl(post.imageUrl) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  
  // ⭐ Tag state
  const [tags, setTags] = useState(post.tags || []);
  const [tagInput, setTagInput] = useState('');

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const tagInputRef = useRef(null);

  useEffect(() => {
    // Generate preview for new file
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

  // ⭐ Tag management functions
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
      // Parse hashtags from caption
      const parsed = parseTags(caption || '');
      const merged = [...tags];
      for (const t of parsed) if (!merged.includes(t)) merged.push(t);

      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);
      if (removeImage) fd.append('removeImage', 'true');
      if (merged.length) fd.append('tags', JSON.stringify(merged)); // ⭐ Send tags

      await API.put(`/posts/${post._id || post.id}`, fd);

      onSaved(); // Tell parent to refresh posts
      onClose(); // Close the editor
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-md opacity-20 pointer-events-none -z-10"></div>

          <div className="relative bg-white dark:bg-[#0f1c2e] rounded-3xl shadow-2xl border border-purple-200/50 dark:border-purple-900/50 overflow-hidden">
            
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 bg-white/95 dark:bg-[#0f1c2e]/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                      Edit Post
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Update your content & tags
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all duration-200"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Caption Field */}
              <div className="space-y-2">
                <label htmlFor="caption" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                  Caption
                </label>
                <textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-2xl bg-neutral-50 dark:bg-[#07142a] border-2 border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-300 text-sm sm:text-base"
                  placeholder="Edit your caption..."
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  💡 Use #hashtags to auto-tag your post
                </p>
              </div>

              {/* ⭐ Tags Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Tags
                </h3>

                {/* Tag chips */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <motion.span
                        key={t}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 border border-purple-200 dark:border-purple-800/50 text-sm"
                      >
                        <span className="text-purple-700 dark:text-purple-300 font-medium">#{t}</span>
                        <button 
                          type="button" 
                          onClick={() => removeTag(t)}
                          className="text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-200 transition-colors"
                          aria-label={`Remove tag ${t}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Tag input */}
                <div className="flex gap-2">
                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tags (press Enter)"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-sm transition-all duration-300"
                    aria-label="Add tag"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (tagInput.trim()) addTag(tagInput);
                      tagInputRef.current?.focus();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium text-sm border border-purple-200 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>

              {/* Image Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  Image
                </h3>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Post preview"
                      className="w-full max-h-80 object-cover rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Change image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                        aria-label="Remove image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload/Change Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border-2 border-dashed border-neutral-300 dark:border-neutral-600 hover:border-purple-400 dark:hover:border-purple-600 text-neutral-700 dark:text-neutral-300 font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {previewUrl ? 'Change Image' : 'Add Image'}
                  </button>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800/50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 relative overflow-hidden px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 hover:from-blue-500 hover:via-purple-500 hover:to-purple-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </span>
                </motion.button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3.5 rounded-xl bg-white dark:bg-[#1a1f3a] text-neutral-700 dark:text-neutral-200 font-semibold border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
