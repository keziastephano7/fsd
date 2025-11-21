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
  const [visibility, setVisibility] = useState(post.visibility || 'public');
  const [selectedGroupIds, setSelectedGroupIds] = useState(
    Array.isArray(post.targetGroups)
      ? post.targetGroups.map((g) => g?._id || g?.id || g)
      : []
  );
  const [groupOptions, setGroupOptions] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');

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

  useEffect(() => {
    let mounted = true;
    const fetchGroups = async () => {
      setGroupsLoading(true);
      setGroupsError('');
      try {
        const res = await API.get('/groups');
        if (!mounted) return;
        setGroupOptions(res.data || []);
      } catch (err) {
        if (!mounted) return;
        setGroupsError(err.response?.data?.message || 'Unable to load your groups.');
      } finally {
        if (mounted) setGroupsLoading(false);
      }
    };
    fetchGroups();
    return () => {
      mounted = false;
    };
  }, []);

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

    if (visibility === 'groups' && selectedGroupIds.length === 0) {
      setError('Select at least one group for private posts.');
      return;
    }

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
      fd.append('visibility', visibility);
      if (visibility === 'groups') {
        fd.append('targetGroups', JSON.stringify(selectedGroupIds));
      }
      
      const response = await API.put(`/posts/${post._id || post.id}`, fd);
      const updatedPost = response.data;
      
      // Dispatch event with the complete updated post data including new tags
      window.dispatchEvent(new CustomEvent('post:updated', { 
        detail: {
          ...updatedPost,
          _id: post._id || post.id,
          tags: merged // Ensure tags are included
        }
      }));
      
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Enhanced Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          aria-hidden="true"
        />

        {/* Enhanced Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-post-title"
        >
          {/* Enhanced Header */}
          <div className="sticky top-0 z-10 px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <div>
                <h2 id="edit-post-title" className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Post
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your content & tags
                </p>
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a2 2 0 012-2h2a2 2 0 012 2v2H3V4zM3 9h6v6H5a2 2 0 01-2-2V9zM11 4a2 2 0 012-2h2a2 2 0 012 2v6h-6V4zM11 13h6v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Visibility
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('public');
                    setError('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-2xl border-2 text-sm ${
                    visibility === 'public'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('groups')}
                  className={`flex-1 px-4 py-2 rounded-2xl border-2 text-sm ${
                    visibility === 'groups'
                      ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/30'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Specific groups
                </button>
              </div>
              {visibility === 'groups' && (
                <div className="space-y-2">
                  {groupsLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading groups…</p>
                  ) : groupOptions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You’re not in any groups yet.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {groupOptions.map((group) => {
                        const id = group._id || group.id;
                        const selected = selectedGroupIds.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setSelectedGroupIds((prev) =>
                                prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
                              );
                              setError('');
                            }}
                            className={`px-4 py-2 rounded-2xl border text-sm transition-all ${
                              selected
                                ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/30'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {group.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {groupsError && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
                      {groupsError}
                    </p>
                  )}
                  {visibility === 'groups' && selectedGroupIds.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-xl px-3 py-2">
                      Select at least one group to share this post with.
                    </p>
                  )}
                </div>
              )}
            </div>
            {/* Enhanced Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              aria-label="Close edit post modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Caption */}
            <div className="space-y-2">
              <label htmlFor="caption" className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Caption
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Edit your caption..."
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[15px] text-gray-900 dark:text-white resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all font-medium"
                aria-label="Edit caption"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                #hashtags supported
              </div>
            </div>

            {/* Enhanced Tags */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Tags
              </h3>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2" role="list" aria-label="Post tags">
                  {tags.map(t => (
                    <motion.span
                      key={t}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 text-sm shadow-sm"
                      role="listitem"
                    >
                      <span className="text-blue-700 dark:text-blue-300 font-medium">#{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="text-blue-500 hover:text-blue-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 rounded"
                        aria-label={`Remove tag ${t}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition"
                  aria-label="Add tags"
                />
                <motion.button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim()) addTag(tagInput);
                    tagInputRef.current?.focus();
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-lg transition-all"
                  aria-label="Add tag"
                >
                  Add
                </motion.button>
              </div>
            </div>

            {/* Enhanced Image Section */}
            <div className="space-y-3">
              {previewUrl && (
                <motion.div 
                  className="relative group rounded-2xl overflow-hidden shadow-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <img
                    src={previewUrl}
                    alt="Post preview"
                    className="w-full max-h-80 object-cover rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg transition-all flex items-center gap-2"
                      aria-label="Change image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Change
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={handleRemoveImage}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg transition-all flex items-center gap-2"
                      aria-label="Remove image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </motion.button>
                  </div>
                </motion.div>
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
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {previewUrl ? 'Change Image' : 'Add Image'}
                </motion.button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </div>

            {/* Enhanced Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800"
                  role="alert"
                  aria-live="assertive"
                >
                  <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
                    <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 relative overflow-hidden px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.svg 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="none"
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </motion.svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </span>
              </motion.button>
              <motion.button
                type="button"
                onClick={onClose}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}