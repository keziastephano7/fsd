import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { AuthContext } from '../AuthContext';
import { parseTags } from '../utils/tags';
import { buildUrl } from '../utils/url';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_CHAR = 1000;

export default function CreatePost({ onCreated }) {
  const { user } = useContext(AuthContext);

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const previewRef = useRef(null);
  const tagInputRef = useRef(null);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (!user) {
      setCaption('');
      setFile(null);
      setPreviewUrl('');
      setTags([]);
      setTagInput('');
      setError('');
      setFieldErrors({});
    }
  }, [user]);

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

  const handleFileChange = (e) => {
    setError('');
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError('Image is too large (max 5 MB).');
      return;
    }
    setFile(f);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.type.startsWith('image/')) {
        if (f.size <= MAX_IMAGE_BYTES) {
          setFile(f);
        } else {
          setError('Image is too large (max 5 MB).');
        }
      } else {
        setError('Please select an image file.');
      }
    }
  };

  const removeImage = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canSubmit = () => {
    const hasContent = caption.trim().length > 0 || file !== null;
    return user && hasContent && !loading && caption.length <= MAX_CHAR;
  };

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    setFieldErrors({});

    if (!user) {
      setError('You must be logged in to post.');
      return;
    }

    // Parse hashtags from caption and merge with manual tags
    const parsed = parseTags(caption || '');
    const merged = [...tags];
    for (const t of parsed) if (!merged.includes(t)) merged.push(t);

    if (!canSubmit()) {
      setError('Write something or attach an image before posting.');
      return;
    }

    if (caption.length > MAX_CHAR) {
      setFieldErrors({ caption: `Caption exceeds ${MAX_CHAR} characters.` });
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption.trim());
      if (file) fd.append('image', file);
      if (merged.length) fd.append('tags', JSON.stringify(merged));

      const res = await API.post('/posts', fd);
      const created = res.data || {};
      if (!created.tags || !Array.isArray(created.tags)) {
        created.tags = merged;
      }

      if (onCreated) {
        onCreated(created);
      }

      setCaption('');
      removeImage();
      setTags([]);
      setTagInput('');
      setError('');
      setFieldErrors({});
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => { if (x.param) map[x.param] = x.msg; });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Error creating post.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-purple-200 dark:border-purple-800/50 text-center select-none">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Ready to share?</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Sign in to create and share your posts with Luna</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto relative"
    >
      <form
        onSubmit={submit}
        className="relative bg-white dark:bg-[#0f1c2e] rounded-3xl shadow-2xl border-2 border-purple-200/50 dark:border-purple-900/50 overflow-hidden"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        noValidate
        aria-label="Create new post form"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center gap-4">
          <div className="shrink-0">
            {user?.avatarUrl ? (
              <img
                src={buildUrl(user.avatarUrl)}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover ring-4 ring-purple-500/30 shadow-lg"
                onError={(e) => e.currentTarget.style.display = 'none'}
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-4 ring-purple-500/30 shadow-lg select-none">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2 select-none">
              <span>Create Post</span>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 select-none">
              Share your thoughts with {user.name}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Caption Textarea */}
          <div className="space-y-2">
            <textarea
              id="caption"
              name="caption"
              placeholder="What's on your mind? ✨"
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                setError('');
                setFieldErrors({});
              }}
              rows={4}
              maxLength={MAX_CHAR}
              className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-2xl bg-neutral-50 dark:bg-[#07142a] border-2 border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-neutral-900 dark:text-neutral-100 resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-300 text-sm sm:text-base"
              aria-invalid={fieldErrors.caption ? "true" : "false"}
              aria-describedby="caption-error"
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 dark:text-neutral-400 select-none">
                💡 Use #hashtags to categorize your post
              </span>
              <span className={`font-medium select-none ${caption.length > MAX_CHAR * 0.9 ? 'text-red-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {caption.length}/{MAX_CHAR}
              </span>
            </div>
          </div>

          {/* Tags Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 select-none">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Tags
            </h3>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2" role="list" aria-label="Selected tags">
                {tags.map(t => (
                  <motion.span
                    key={t}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 border border-purple-200 dark:border-purple-800/50 text-sm"
                    role="listitem"
                  >
                    <span className="text-purple-700 dark:text-purple-300 font-medium select-none">#{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-purple-500 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
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

            <div className="flex gap-2">
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-2 border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 text-sm transition-all duration-300"
                aria-label="Add tags"
              />
              <button
                type="button"
                onClick={() => {
                  if (tagInput.trim()) addTag(tagInput);
                  tagInputRef.current?.focus();
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium text-sm border border-purple-200 dark:border-purple-800/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Add tag"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Post preview"
                  className="w-full max-h-80 object-cover rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 shadow-lg"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
                    aria-label="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full select-none">
                  {file ? `${Math.round(file.size / 1024)} KB` : ''}
                </div>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer select-none ${
                  dragActive
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-purple-400 dark:hover:border-purple-600'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="post-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload image"
                />

                <div className="pointer-events-none">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    {dragActive ? 'Drop your image here' : 'Add a photo'}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Drag and drop or click to browse</p>
                  <p className="text-xs text-neutral-500">PNG, JPG up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Error Messages */}
          <AnimatePresence>
            {(error || fieldErrors.caption) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50"
                role="alert"
                aria-live="assertive"
                id="caption-error"
              >
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.caption || error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-neutral-50 dark:bg-[#07142a] border-t border-neutral-100 dark:border-neutral-800/50">
          <div className="flex items-center justify-end gap-4">
            <motion.button
              whileHover={canSubmit() ? { scale: 1.05 } : {}}
              whileTap={canSubmit() ? { scale: 0.95 } : {}}
              type="submit"
              disabled={!canSubmit()}
              className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all duration-300 ${
                canSubmit()
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 text-white hover:shadow-purple-500/50 group focus:outline-none focus:ring-2 focus:ring-purple-500'
                  : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
              aria-disabled={!canSubmit()}
            >
              {canSubmit() && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
              )}

              <span className="relative flex items-center gap-2 select-none">
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Share Post
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
