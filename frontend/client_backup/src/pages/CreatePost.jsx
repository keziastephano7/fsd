import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { AuthContext } from '../AuthContext';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CHAR = 1000;

export default function CreatePost({ onCreated }) {
  const { user } = useContext(AuthContext);

  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const previewRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      setCaption('');
      setFile(null);
      setPreviewUrl('');
      setError('');
      setFieldErrors({});
      setExpanded(false);
    }
  }, [user]);

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

  // Scroll textarea into view when expanded (useful in modal with scroll)
  useEffect(() => {
    if (expanded && textareaRef.current) {
      // Timeout ensures it waits for animation/layout
      setTimeout(() => {
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textareaRef.current.focus();
      }, 200);
    }
  }, [expanded]);

  const handleFileChange = (e) => {
    setError('');
    setFieldErrors({});
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
      setError('Image too large (max 5MB).');
      return;
    }
    setFile(f);
    setExpanded(true);
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
    e?.preventDefault();
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
      setFieldErrors({ caption: `Exceeds ${MAX_CHAR} characters` });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption.trim());
      if (file) fd.append('image', file);
      const res = await API.post('/posts', fd);
      const created = res.data;
      setCaption('');
      removeImage();
      setExpanded(false);
      onCreated && onCreated(created);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const map = {};
        data.errors.forEach(x => {
          if (x.param) map[x.param] = x.msg;
        });
        setFieldErrors(map);
      } else {
        setError(data?.message || 'Error creating post.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const Collapsed = () => (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      className="w-full text-left p-3 rounded-lg bg-neutral-50 dark:bg-[#071424] flex items-center gap-3 border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white shrink-0">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg select-none">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
      <div className="flex-1 text-sm text-neutral-500 select-none">Create post...</div>
      <label
        htmlFor="quick-photo"
        className="inline-flex items-center px-3 py-1 bg-neutral-100 dark:bg-[#0b1220] rounded cursor-pointer text-xs select-none hover:bg-neutral-200 dark:hover:bg-[#16223d] transition-colors"
      >
        Photo
        <input id="quick-photo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </label>
    </button>
  );

  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col"
      style={{ maxHeight: '90vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} 
      ref={formRef}
    >
      <AnimatePresence initial={false}>
        {!expanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, height: 72 }}
            animate={{ opacity: 1, height: 72 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Collapsed />
          </motion.div>
        ) : (
          <motion.form
            key="expanded"
            onSubmit={submit}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="bg-white dark:bg-[#041028] rounded-2xl p-5 border border-purple-100 dark:border-purple-900 shadow flex flex-col"
            aria-label="Create new post form"
          >
            <div className="flex gap-4 flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg select-none">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={4}
                maxLength={MAX_CHAR}
                placeholder="Share something..."
                className="flex-grow resize-none p-3 rounded-lg bg-neutral-50 dark:bg-[#071424] border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm placeholder-neutral-500 dark:placeholder-neutral-400"
                aria-label="Post caption"
              />
            </div>

            <div className="mt-4 flex flex-col gap-4 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  htmlFor="image"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-100 dark:bg-[#0b1220] cursor-pointer text-xs select-none hover:bg-neutral-200 dark:hover:bg-[#16223d] transition-colors"
                >
                  Photo
                  <input id="image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 select-none">
                  {caption.length}/{MAX_CHAR}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  className={`px-5 py-2 rounded-full text-white text-sm transition ${
                    canSubmit() ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:brightness-110' : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setError('');
                    setFieldErrors({});
                  }}
                  className="px-4 py-2 rounded-md border border-neutral-200 dark:border-purple-900 text-sm hover:bg-neutral-100 dark:hover:bg-[#16223d] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-red-500 select-none" role="alert" aria-live="assertive">
              {fieldErrors.caption ? fieldErrors.caption : error}
            </div>

            {previewUrl && (
              <div className="mt-4 rounded-md overflow-hidden border border-neutral-200 dark:border-purple-900 flex-shrink-0">
                <img src={previewUrl} alt="preview" className="w-full h-56 object-cover" />
                <div className="p-2 flex justify-between items-center">
                  <div className="text-xs text-neutral-500 select-none">Preview — {Math.round((file?.size || 0) / 1024)} KB</div>
                  <button type="button" onClick={removeImage} className="text-xs text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
