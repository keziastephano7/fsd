import React, { useState } from 'react';
import API from '../api';

export default function EditPost({ post, onSaved, onClose }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('caption', caption);
      if (file) fd.append('image', file);

      const res = await API.put(`/posts/${post._id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSaved && onSaved(res.data);
      onClose && onClose();
    } catch (err) {
      console.error('Edit post failed:', err);
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-xl shadow-md border border-secondary">
      <h4 className="text-lg font-semibold text-deepPurple mb-4">Edit Post</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Update your caption"
          className="w-full px-4 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-lightGray text-darkText"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-darkText"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-darkPink transition"
          >
            Cancel
          </button>
        </div>

        {error && <p className="text-error text-sm mt-1">{error}</p>}
      </form>
    </div>
  );
}
