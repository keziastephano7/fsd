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
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState('');

  const previewRef = useRef(null);
  const tagInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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
      setVisibility('public');
      setSelectedGroupIds([]);
      setError('');
      setFieldErrors({});
      setIsExpanded(false);
      setVisibility('public');
      setGroupOptions([]);
      setSelectedGroupIds([]);
      setGroupsError('');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
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

  const toggleGroupSelection = (groupId) => {
    setSelectedGroupIds(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      }
      return [...prev, groupId];
    });
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
    setIsExpanded(true);
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
          setIsExpanded(true);
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
    const groupsValid = visibility === 'public' || selectedGroupIds.length > 0;
    return user && hasContent && !loading && caption.length <= MAX_CHAR && groupsValid;
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
    if (visibility === 'groups' && selectedGroupIds.length === 0) {
      setError('Select at least one group to share this post with.');
    } else {
      setError('Write something or attach an image before posting.');
    }
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
      fd.append('visibility', visibility);
      if (visibility === 'groups') {
        fd.append('targetGroups', JSON.stringify(selectedGroupIds));
      }

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
      setIsExpanded(false);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-blue-200 dark:border-gray-600 text-center shadow-lg"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ready to share?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Sign in to create and share your posts with the community</p>
        <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto relative"
    >
      <motion.form
        onSubmit={submit}
        className={`relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 transition-all duration-500 overflow-hidden ${
          isExpanded || caption || file
            ? 'border-blue-200 dark:border-blue-800 shadow-2xl'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        noValidate
        aria-label="Create new post form"
        layout
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header */}
        <motion.div 
          className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 relative"
          layout
        >
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={buildUrl(user.avatarUrl)}
                alt={user.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-lg"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-blue-500/30 shadow-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
          <div className="flex-1">
            <motion.h2 
              className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2"
              layout
            >
              <span>Create Post</span>
              <motion.span 
                className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Share with your community
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="p-6 space-y-4 relative"
          layout
        >
          {/* Caption Textarea */}
          <motion.div className="space-y-2" layout>
            <textarea
              ref={textareaRef}
              id="caption"
              name="caption"
              placeholder="What's on your mind? ✨"
              value={caption}
              onChange={e => {
                setCaption(e.target.value);
                setError('');
                setFieldErrors({});
                if (e.target.value && !isExpanded) {
                  setIsExpanded(true);
                }
              }}
              onFocus={() => setIsExpanded(true)}
              rows={3}
              maxLength={MAX_CHAR}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 dark:text-white text-[15px] placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-300 resize-none font-medium"
              aria-invalid={fieldErrors.caption ? "true" : "false"}
              aria-describedby="caption-error"
            />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                #hashtags supported
              </span>
              <span className={`font-semibold ${caption.length > MAX_CHAR * 0.9 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {caption.length}/{MAX_CHAR}
              </span>
            </div>
          </motion.div>

          {/* Tags Section */}
          <AnimatePresence>
            {(isExpanded || tags.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                        exit={{ scale: 0, opacity: 0 }}
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
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add tags..."
                    className="
    flex-1 px-3 py-2 rounded-xl 
    bg-gray-100 dark:bg-gray-800 
    border-2 border-gray-200 dark:border-gray-700 
    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 
    text-sm transition
    text-gray-900 dark:text-white
  "
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
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-lg transition-all"
                    aria-label="Add tag"
                  >
                    Add
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        {/* Visibility Selector */}
        <AnimatePresence>
          {(isExpanded || visibility === 'groups') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a2 2 0 012-2h2a2 2 0 012 2v2H3V4zM3 9h6v6H5a2 2 0 01-2-2V9zM11 4a2 2 0 012-2h2a2 2 0 012 2v6h-6V4zM11 13h6v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Visibility
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('public');
                      setError('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-2xl border-2 ${
                      visibility === 'public'
                        ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('groups');
                      setIsExpanded(true);
                    }}
                    className={`flex-1 px-4 py-2 rounded-2xl border-2 ${
                      visibility === 'groups'
                        ? 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Specific groups
                  </button>
                </div>
                {visibility === 'groups' && (
                  <div className="space-y-3">
                    {groupsLoading ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading groups…</p>
                    ) : groupOptions.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You’re not in any groups yet. Create or join one to share privately.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {groupOptions.map((group) => {
                          const selected = selectedGroupIds.includes(group._id);
                          return (
                            <button
                              key={group._id}
                              type="button"
                              onClick={() => {
                                toggleGroupSelection(group._id);
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Upload */}
          <AnimatePresence>
            {(isExpanded || file) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {previewUrl ? (
                  <motion.div 
                    className="relative group rounded-2xl overflow-hidden shadow-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <img
                      src={previewUrl}
                      alt="Post preview"
                      className="w-full max-h-80 object-cover rounded-2xl"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg transition-all"
                        aria-label="Change image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={removeImage}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg transition-all"
                        aria-label="Remove image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </motion.button>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-xl">
                      {file ? `${Math.round(file.size / 1024)} KB` : ''}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
                      dragActive
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
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
                      <motion.div 
                        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"
                        whileHover={{ rotate: 5 }}
                      >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </motion.div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {dragActive ? 'Drop your image here' : 'Add a photo'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">Drag & drop or click to upload</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Messages */}
          <AnimatePresence>
            {(error || fieldErrors.caption) && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800"
                role="alert"
                aria-live="assertive"
                id="caption-error"
              >
                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2 font-medium">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.caption || error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <AnimatePresence>
          {(isExpanded || caption || file) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4">
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setCaption('');
                    removeImage();
                    setTags([]);
                    setError('');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-sm"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={canSubmit() ? { 
                    scale: 1.05,
                    boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.5)"
                  } : {}}
                  whileTap={canSubmit() ? { scale: 0.95 } : {}}
                  type="submit"
                  disabled={!canSubmit()}
                  className={`relative overflow-hidden px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                    canSubmit()
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  aria-disabled={!canSubmit()}
                >
                  {/* Shimmer effect */}
                  {canSubmit() && (
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
                  )}
                  
                  <span className="relative flex items-center gap-2">
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
                        Publishing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Share Post
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
    </motion.div>
  );
}