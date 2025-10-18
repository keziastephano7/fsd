// frontend/client/src/components/CommentList.js
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function CommentList({ postId, initial = [] , onRemoved }) {
  const [comments, setComments] = useState(initial);
  const [loading, setLoading] = useState(!initial.length);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Load comments error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [postId]);

  const remove = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await API.delete(`/posts/${postId}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onRemoved && onRemoved(commentId);
    } catch (err) {
      console.error('Delete comment error', err);
      alert(err.response?.data?.message || 'Cannot delete comment');
    }
  };

  if (loading) return <p>Loading comments...</p>;
  if (!comments.length) return <p style={{ color: '#666' }}>No comments yet — be the first 👇</p>;

  return (
    <div>
      {comments.map(c => (
        <div key={c._id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 14 }}>
            <strong>{c.author?.name || 'User'}</strong>
            <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
              {new Date(c.createdAt).toLocaleString()}
            </span>
            {/* show delete button if current user */}
            {String(c.author?._id || c.author) === String(JSON.parse(localStorage.getItem('user') || '{}').id || JSON.parse(localStorage.getItem('user') || '{}')._id) && (
              <button onClick={() => remove(c._id)} style={{ float: 'right', background: 'transparent', color: '#ff6b6b', border: 'none' }}>Delete</button>
            )}
          </div>
          <div style={{ marginTop: 6 }}>{c.text}</div>
        </div>
      ))}
    </div>
  );
}
