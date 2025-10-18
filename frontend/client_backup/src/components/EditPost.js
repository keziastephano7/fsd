import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

export default function EditPost({ post, onSaved, onClose }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(post.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const objectUrlRef = useRef(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = e => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(selected);
    objectUrlRef.current = url;
    setPreview(url);
    setFile(selected);
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);

      await API.put(`/posts/${post._id || post.id}`, fd);

      onSaved(); // Notify parent PostCard to refresh
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-[#07142a] rounded-xl border border-neutral-200 dark:border-neutral-800 mb-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-[#07142a] text-neutral-900 dark:text-neutral-100 resize-none"
          placeholder="Edit your caption..."
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-neutral-900 dark:text-neutral-100"
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            className="w-full h-auto rounded-lg mt-2 object-cover"
          />
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-[#052033] text-neutral-900 dark:text-neutral-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
