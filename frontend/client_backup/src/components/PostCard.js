import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import EditPost from './EditPost';

export default function PostCard({ post, onUpdate }) {
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      setCurrentUserId(u?.id || u?._id || null);
    } catch {
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
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const isAuthor = String(post.author?._id || post.author) === String(currentUserId);

  return (
    <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition mb-6 border border-secondary">
      {/* --- Post Header --- */}
      <div className="flex items-center justify-between mb-2">
        <Link
          to={`/profile/${post.author._id || post.author}`}
          className="font-semibold text-primary hover:text-accent"
        >
          {post.author.name || post.author}
        </Link>
        <span className="text-muted text-sm">
          {new Date(post.createdAt).toLocaleString()}
        </span>
      </div>

      {/* --- Image --- */}
      {post.imageUrl && (
        <img
          src={`http://localhost:5000${post.imageUrl}`}
          alt="post"
          className="w-full rounded-lg mb-2"
        />
      )}

      {/* --- Caption --- */}
      <p className="text-darkText mb-3">{post.caption}</p>

      {/* --- Actions --- */}
      <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
        <button
          onClick={toggleLike}
          className={`font-medium transition ${
            liked ? 'text-error' : 'text-darkText hover:text-primary'
          }`}
        >
          {liked ? '❤️ Unlike' : '🤍 Like'} ({likes})
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-darkText hover:text-primary"
        >
          {showComments ? 'Hide Comments' : '💬 Comments'}
        </button>

        {isAuthor && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-secondary hover:text-accent transition"
            >
              ✏️ Edit
            </button>

            <button
              onClick={deletePost}
              className="text-error hover:text-darkPink transition"
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {/* --- Edit Form --- */}
      {editing && (
        <EditPost
          post={post}
          onSaved={() => onUpdate && onUpdate()}
          onClose={() => setEditing(false)}
        />
      )}

      {/* --- Comments Section --- */}
      {showComments && (
        <div className="border-t border-secondary mt-3 pt-3 space-y-2">
          <CommentList key={newComment?._id || post._id} postId={post._id} />
          <CommentForm
            postId={post._id}
            onAdded={(comment) => setNewComment(comment)}
          />
        </div>
      )}
    </div>
  );
}
