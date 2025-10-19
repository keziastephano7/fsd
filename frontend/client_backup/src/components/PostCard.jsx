import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';
import { Link } from 'react-router-dom';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import EditPost from './EditPost';
import { AuthContext } from '../AuthContext';
import { buildUrl } from '../utils/url';
import TagChip from './TagChip';

/**
 * PostCard - Clean Instagram-Style Design
 * - Breathable spacing and clean borders
 * - Full-width images (no rounded corners)
 * - Minimal, elegant aesthetic
 * - Perfect for social media feel
 */

export default function PostCard({ post, onUpdate }) {
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes.length : post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState(null);
  const [editing, setEditing] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

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
    if (isLiking) return;
    
    setIsLiking(true);
    const prevLiked = liked;
    const prevLikes = likes;
    
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);

    try {
      const res = await API.post(`/posts/${post._id || post.id}/like`);
      setLikes(Array.isArray(res.data.likes) ? res.data.likes.length : res.data.likes ?? likes);
      setLiked(res.data.liked ?? !prevLiked);
    } catch (err) {
      console.error('Like error', err);
      setLiked(prevLiked);
      setLikes(prevLikes);
      alert(err.response?.data?.message || 'Could not toggle like');
    } finally {
      setIsLiking(false);
    }
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;
    try {
      await API.delete(`/posts/${post._id || post.id}`);
      
      window.dispatchEvent(new CustomEvent('post:deleted', { 
        detail: { postId: post._id || post.id } 
      }));
      
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const isAuthor = String(post.author?._id || post.author || post.authorId) === String(currentUserId);

  const authorAvatar = post.author?.avatarUrl ? buildUrl(post.author.avatarUrl) : null;
  const authorIdForLink = post.author?._id || post.author || post.authorId;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#0f1c2e] rounded-xl shadow-lg border border-neutral-200/30 dark:border-neutral-800/30 overflow-hidden mb-6"
      >
        {/* Post Header - Clean & Minimal */}
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to={`/profile/${authorIdForLink}`} className="flex items-center gap-3 group flex-1 min-w-0">
            {/* Avatar */}
            <div className="shrink-0">
              {authorAvatar ? (
                <img 
                  src={authorAvatar} 
                  alt={post.author?.name || 'Author'} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-200" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/20 group-hover:ring-purple-500/40 transition-all duration-200">
                  {String(post.author?.name || post.author || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                {post.author?.name || post.author || 'User'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                }) : ''}
              </p>
            </div>
          </Link>

          {/* Menu Button */}
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#0f1c2e] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden z-10"
                  >
                    <button
                      onClick={() => {
                        setEditing(true);
                        setShowComments(false);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        deletePost();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Post
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Post Image - Full Width, No Border */}
        {post.imageUrl && (
          <div className="w-full">
            <img
              src={buildUrl(post.imageUrl)}
              alt="post"
              className="w-full object-cover max-h-[600px]"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}

        {/* Post Content - Clean Spacing */}
        <div className="px-4 py-3">
          {/* Action Buttons */}
          <div className="flex items-center gap-4 mb-3">
            {/* Like Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleLike}
              disabled={isLiking}
              className="flex items-center gap-2 group"
            >
              <motion.div
                animate={liked ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <svg
                  className={`w-6 h-6 transition-colors duration-200 ${
                    liked 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-neutral-700 dark:text-neutral-300 group-hover:text-red-500'
                  }`}
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={liked ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {likes}
              </span>
            </motion.button>

            {/* Comment Button */}
            <button
              onClick={() => {
                setShowComments(prev => !prev);
                if (!showComments) setEditing(false);
              }}
              className="flex items-center gap-2 group"
            >
              <svg 
                className="w-6 h-6 text-neutral-700 dark:text-neutral-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {commentsCount}
              </span>
            </button>

            {/* Share Button */}
            <button className="flex items-center gap-2 group ml-auto">
              <svg 
                className="w-6 h-6 text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Likes Count */}
          {likes > 0 && (
            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              {likes} {likes === 1 ? 'like' : 'likes'}
            </p>
          )}

          {/* Caption */}
          {(post.caption || post.content) && (
            <div className="mb-2">
              <p className="text-sm text-neutral-900 dark:text-neutral-100 leading-relaxed">
                <Link 
                  to={`/profile/${authorIdForLink}`} 
                  className="font-semibold hover:text-purple-600 dark:hover:text-purple-400 transition-colors mr-1"
                >
                  {post.author?.name || 'User'}
                </Link>
                {post.caption || post.content}
              </p>
            </div>
          )}

          {/* Tags Display */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {post.tags.map((tag, index) => (
                <TagChip key={`${tag}-${index}`} tag={tag} />
              ))}
            </div>
          )}

          {/* View Comments Button */}
          {commentsCount > 0 && !showComments && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              View all {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}

          {/* Time */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 uppercase mt-2">
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }) : ''}
          </p>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20"
            >
              <div className="p-4 space-y-4">
                <CommentList 
                  key={newComment?._id || post._id} 
                  postId={post._id || post.id}
                  onRemoved={() => setCommentsCount(prev => Math.max(0, prev - 1))}
                />
                <CommentForm
                  postId={post._id || post.id}
                  onAdded={(c) => {
                    setNewComment(c);
                    setCommentsCount(prev => prev + 1);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* Edit Modal */}
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
    </>
  );
}
