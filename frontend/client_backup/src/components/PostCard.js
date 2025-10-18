import React, { useState, useEffect, useContext } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import EditPost from './EditPost';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';

export default function PostCard({ post, onUpdate }) {
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState(null);
  const [editing, setEditing] = useState(false);

  const { user } = useContext(AuthContext);
  const currentUserId = user?.id || user?._id || null;

  useEffect(() => {
    if (post.liked !== undefined) {
      setLiked(Boolean(post.liked));
    } else if (Array.isArray(post.likes) && currentUserId) {
      setLiked(post.likes.includes(currentUserId));
    }
    setLikes(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  }, [post, currentUserId]);

  const toggleLike = async () => {
    try {
      const res = await API.post(`/posts/${post._id || post.id}/like`);
      setLikes(Array.isArray(res.data.likes) ? res.data.likes.length : res.data.likes ?? likes);
      setLiked(res.data.liked ?? !liked);
    } catch (err) {
      console.error('Like error', err);
      alert(err.response?.data?.message || 'Could not toggle like');
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await API.delete(`/posts/${post._id || post.id}`);
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const isAuthor = String(post.author?._id || post.author || post.authorId) === String(currentUserId);

  // Build author avatar url (if author is an object with avatarUrl)
  const authorAvatar = post.author?.avatarUrl ? buildUrl(post.author.avatarUrl) : null;
  const authorIdForLink = post.author?._id || post.author || post.authorId;

  return (
    <div className="bg-white dark:bg-[#07142a] rounded-xl shadow p-4 hover:shadow-lg transition mb-6 border border-neutral-100 dark:border-neutral-800">
      {/* --- Post Header with avatar --- */}
      <div className="flex items-start gap-3 mb-3">
        <Link to={`/profile/${authorIdForLink}`} className="shrink-0">
          {authorAvatar ? (
            <img src={authorAvatar} alt={post.author?.name || 'Author'} className="w-11 h-11 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-sm text-neutral-600">
              {String(post.author?.name || post.author || '?').charAt(0)}
            </div>
          )}
        </Link>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link to={`/profile/${authorIdForLink}`} className="font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary">
              {post.author?.name || post.author || 'User'}
            </Link>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}</span>
          </div>
          {post.subtitle && <div className="text-sm text-neutral-500 dark:text-neutral-400">{post.subtitle}</div>}
        </div>
      </div>

      {post.imageUrl && (
        <img
          src={buildUrl(post.imageUrl)}
          alt="post"
          className="w-full rounded-lg mb-3 object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}

      <p className="text-neutral-800 dark:text-neutral-100 mb-3">{post.caption || post.content}</p>

      <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
        <button
          onClick={toggleLike}
          className={`font-medium transition ${liked ? 'text-red-500' : 'text-neutral-800 dark:text-neutral-100 hover:text-primary'}`}
        >
          {liked ? '❤️ Unlike' : '🤍 Like'} ({likes})
        </button>

        <button onClick={() => setShowComments(s => !s)} className="text-neutral-800 dark:text-neutral-100 hover:text-primary">
          {showComments ? 'Hide Comments' : '💬 Comments'}
        </button>

        {isAuthor && (
          <>
            <button onClick={() => setEditing(true)} className="text-neutral-600 dark:text-neutral-300 hover:text-accent">✏️ Edit</button>
            <button onClick={deletePost} className="text-red-500 hover:text-red-600">🗑️ Delete</button>
          </>
        )}
      </div>

      {editing && (
        <EditPost
          post={post}
          onSaved={() => {
            setEditing(false);
            onUpdate && onUpdate();
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {showComments && (
        <div className="border-t border-neutral-100 dark:border-neutral-800 mt-3 pt-3 space-y-2">
          <CommentList key={newComment?._id || post._id} postId={post._id || post.id} />
          <CommentForm postId={post._id || post.id} onAdded={(c) => setNewComment(c)} />
        </div>
      )}
    </div>
  );
}