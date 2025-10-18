import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

export default function PostCard({ post, onUpdate }) {
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showComments, setShowComments] = useState(false); // 👈 new state for showing/hiding comments
  const [newComment, setNewComment] = useState(null); // 👈 used to refresh comments instantly when added

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setCurrentUserId(u?.id || u?._id || null);
    } catch (err) {
      setCurrentUserId(null);
    }
  }, []);

  const toggleLike = async () => {
    try {
      const res = await API.post(`/posts/${post._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
    } catch (err) {
      console.error('Like error', err);
      alert(err.response?.data?.message || 'Could not toggle like');
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await API.delete(`/posts/${post._id}`, { headers });
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Delete error full object:', err);
      const msg = err.response?.data?.message || 'Failed to delete post';
      alert(msg);
    }
  };

  const isAuthor = String(post.author?._id || post.author) === String(currentUserId);

  return (
    <div className="post-card">
      {/* --- Post Header --- */}
      <div className="post-header">
        <Link to={`/profile/${post.author._id || post.author}`}>
          {post.author.name || post.author}
        </Link>
        <span className="muted">
          {new Date(post.createdAt).toLocaleString()}
        </span>
      </div>

      {/* --- Image --- */}
      {post.imageUrl && (
        <img
          src={`http://localhost:5000${post.imageUrl}`}
          alt="post"
          className="post-image"
        />
      )}

      {/* --- Caption --- */}
      <p>{post.caption}</p>

      {/* --- Actions --- */}
      <div className="post-actions">
        <button onClick={toggleLike}>
          {liked ? 'Unlike' : 'Like'} ({likes})
        </button>
        <button onClick={() => setShowComments((s) => !s)}>
          {showComments ? 'Hide Comments' : 'Comments'}
        </button>
        {isAuthor && (
          <button onClick={deletePost} className="danger">
            Delete
          </button>
        )}
      </div>

      {/* --- Comments Section --- */}
      {showComments && (
        <div className="comments-section" style={{ marginTop: 10 }}>
          <CommentList key={newComment?._id || post._id} postId={post._id} />
          <CommentForm
            postId={post._id}
            onAdded={(comment) => setNewComment(comment)} // refresh CommentList
          />
        </div>
      )}
    </div>
  );
}
