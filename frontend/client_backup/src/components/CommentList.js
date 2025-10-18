import React, { useEffect, useState } from 'react';
import API from '../api';

export default function CommentList({ postId, initial = [], onRemoved }) {
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

  if (loading) return <p className="text-center text-muted mt-2">Loading comments...</p>;
  if (!comments.length) return <p className="text-center text-muted mt-2">No comments yet — be the first 👇</p>;

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id 
                        || JSON.parse(localStorage.getItem('user') || '{}')._id;

  return (
    <div className="space-y-3 mt-2">
      {comments.map(c => (
        <div key={c._id} className="p-3 bg-lightGray rounded-lg border border-secondary shadow-sm">
          <div className="flex justify-between items-start text-sm text-darkText">
            <div>
              <strong className="text-deepPurple">{c.author?.name || 'User'}</strong>
              <span className="ml-2 text-muted text-xs">{new Date(c.createdAt).toLocaleString()}</span>
            </div>
            {String(c.author?._id || c.author) === String(currentUserId) && (
              <button
                onClick={() => remove(c._id)}
                className="text-error hover:underline text-xs bg-transparent border-none"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-1 text-darkText">{c.text}</p>
        </div>
      ))}
    </div>
  );
}
