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

      onSaved && onSaved(res.data); // notify parent to refresh
      onClose && onClose();
    } catch (err) {
      console.error('Edit post failed:', err);
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <h4>Edit Post</h4>
      <form onSubmit={handleSubmit}>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Update your caption"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
