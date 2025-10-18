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
    <div className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow">
      {/* --- Post Header --- */}
      <div className="flex items-center justify-between mb-2">
        <Link
          to={`/profile/${post.author._id || post.author}`}
          className="font-semibold text-blue-600 hover:underline"
        >
          {post.author.name || post.author}
        </Link>
        <span className="text-sm text-gray-500">
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
      <p className="text-gray-800 mb-3">{post.caption}</p>

      {/* --- Actions --- */}
      <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
        <button
          onClick={toggleLike}
          className={`font-medium ${
            liked ? 'text-red-500' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          {liked ? '❤️ Unlike' : '🤍 Like'} ({likes})
        </button>

        <button
          onClick={() => setShowComments((s) => !s)}
          className="text-gray-600 hover:text-blue-600"
        >
          {showComments ? 'Hide Comments' : '💬 Comments'}
        </button>

        {isAuthor && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-yellow-600 hover:text-yellow-700"
            >
              ✏️ Edit
            </button>

            <button
              onClick={deletePost}
              className="text-red-600 hover:text-red-700"
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
        <div className="border-t border-gray-200 mt-3 pt-3 space-y-2">
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
