// backend/routes/comments.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// POST /api/posts/:postId/comments  -> create comment (protected)
router.post(
  '/',
  auth,
  [ body('text').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 500 }) ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { postId } = req.params;
      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ message: 'Post not found' });

      const comment = new Comment({
        post: postId,
        author: req.userId,
        text: req.body.text
      });
      await comment.save();
      await comment.populate('author', '-password');

      return res.status(201).json(comment);
    } catch (err) {
      console.error('Error creating comment:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/posts/:postId/comments -> list comments for a post
router.get('/', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId }).populate('author', '-password').sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:postId/comments/:commentId -> delete comment (protected, author or post author)
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // allow deletion if comment author or post author
    if (String(comment.author) === req.userId) {
      await comment.deleteOne();
      return res.json({ message: 'Comment deleted' });
    }

    const post = await Post.findById(postId);
    if (post && String(post.author) === req.userId) {
      await comment.deleteOne();
      return res.json({ message: 'Comment deleted' });
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
