// frontend/client/src/components/CommentForm.js
import React, { useState } from 'react';
import API from '../api';

export default function CommentForm({ postId, onAdded }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!text.trim()) return setError('Comment cannot be empty');

    try {
      const res = await API.post(`/posts/${postId}/comments`, { text });
      setText('');
      onAdded && onAdded(res.data);
    } catch (err) {
      console.error('Comment submit error', err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to post comment';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
      <textarea
        placeholder="Write a comment..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
      />
      {error && <div className="error">{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="submit">Comment</button>
      </div>
    </form>
  );
}
