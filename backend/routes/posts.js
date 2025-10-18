const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const fs = require('fs').promises;

// Multer setup - store in /uploads, limit size and accept images only
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ok = allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// POST /api/posts - create post (protected)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { caption } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const post = new Post({ author: req.userId, caption, imageUrl });
    await post.save();
    await post.populate('author', '-password');
    res.json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts - feed (optional ?author=userid)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.author) filter.author = req.query.author;
    const posts = await Post.find(filter).populate('author', '-password').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '-password');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/posts/:id - update caption or image (protected)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden' });

    if (req.body.caption !== undefined) post.caption = req.body.caption;

    if (req.file) {
      // remove old image if exists (do not fail if unlink fails)
      if (post.imageUrl) {
        try {
          const oldPath = path.join(__dirname, '..', post.imageUrl.replace(/^\//, ''));
          await fs.unlink(oldPath).catch(() => {});
        } catch (err) {
          // ignore
        }
      }
      post.imageUrl = `/uploads/${req.file.filename}`;
    }

    await post.save();
    await post.populate('author', '-password');
    res.json(post);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (String(post.author) !== String(req.userId)) return res.status(403).json({ message: 'Forbidden: only author can delete this post' });

    // Remove image file if present (ignore file-not-found)
    if (post.imageUrl) {
      try {
        const relativePath = post.imageUrl.replace(/^\//, '');
        const imagePath = path.join(__dirname, '..', relativePath);
        await fs.unlink(imagePath).catch(() => {});
      } catch (err) {
        // ignore image deletion errors
      }
    }

    await Post.findByIdAndDelete(postId);
    return res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Server error in DELETE /api/posts/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/like - toggle like (protected)
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const userId = req.userId;
    const index = post.likes.findIndex(id => String(id) === userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: index === -1 });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const { body, validationResult } = require('express-validator');

// POST /api/posts - create post (protected)
router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('caption')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Caption can be at most 300 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { caption } = req.body;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
      const post = new Post({ author: req.userId, caption, imageUrl });
      await post.save();
      await post.populate('author', '-password');
      res.json(post);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);