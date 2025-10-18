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
  const [commentsCount, setCommentsCount] = useState(0);


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
  
  useEffect(() => {
    const loadCommentsCount = async () => {
      try {
        const res = await API.get(`/posts/${post._id || post.id}/comments`);
        setCommentsCount(res.data.length || 0);
      } catch (err) {
        console.error('Failed to load comments count', err);
      }
    };

    loadCommentsCount();
  }, [post._id, post.id]);

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
        {/* Like button */}
        <button onClick={toggleLike} className="flex items-center gap-1 font-medium transition">
          <svg
            className={`w-5 h-5 ${liked ? 'text-black' : 'text-gray-400'} dark:${liked ? 'text-white' : 'text-gray-300'}`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M15.03 9.684h3.965c.322 0 .64.08.925.232.286.153.532.374.717.645a2.109 2.109 0 0 1 .242 1.883l-2.36 7.201c-.288.814-.48 1.355-1.884 1.355-2.072 0-4.276-.677-6.157-1.256-.472-.145-.924-.284-1.348-.404h-.115V9.478a25.485 25.485 0 0 0 4.238-5.514 1.8 1.8 0 0 1 .901-.83 1.74 1.74 0 0 1 1.21-.048c.396.13.736.397.96.757.225.36.32.788.269 1.211l-1.562 4.63ZM4.177 10H7v8a2 2 0 1 1-4 0v-6.823C3 10.527 3.527 10 4.176 10Z"
              clipRule="evenodd"
            />
          </svg>
          <span>({likes})</span>
        </button>


        {/* Comment button */}
        <button
          onClick={() => {
            setShowComments(prev => !prev);
            if (!showComments) setEditing(false); // hide edit when opening comments
          }}
          className="flex items-center gap-1 text-neutral-800 dark:text-neutral-100 hover:text-primary"
        >
          <img src="/comment.svg" alt="Comments" className="w-5 h-5" />
          <span>{showComments ? 'Hide Comments' : `Comments (${commentsCount})`}</span>
        </button>


        {/* Edit/Delete buttons (for author) */}
        {isAuthor && (
          <>
            <button
              onClick={() => {
                setEditing(true);
                setShowComments(false); // hide comments when opening edit
              }}
              className="flex items-center gap-1 text-neutral-600 dark:text-neutral-300 hover:text-accent"
            >
              <img src="/edit.svg" alt="Edit" className="w-5 h-5" />
              <span>Edit</span>
            </button>
            <button
              onClick={deletePost}
              className="flex items-center gap-1 text-red-500 hover:text-red-600"
            >
              <img src="/delete.svg" alt="Delete" className="w-5 h-5" />
              <span>Delete</span>
            </button>
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
          <CommentForm
            postId={post._id || post.id}
            onAdded={(c) => {
              setNewComment(c);
              setCommentsCount(prev => prev + 1); // increment count
            }}
          />
        </div>
      )}
    </div>
  );
}