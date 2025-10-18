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
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to post comment';
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        placeholder="Write a comment..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        className="w-full px-4 py-2 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-lightGray text-darkText"
      />
      {error && <p className="text-error text-sm mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-accent transition"
        >
          Comment
        </button>
      </div>
    </form>
  );
}
