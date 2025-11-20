const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');

const imagekit = require('../config/imagekit');  

// // Multer setup
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ok = allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// POST /api/posts - create post (protected)
router.post(
  '/',
  auth,
  upload.single('image'),
  [
    body('caption')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Caption can be at most 1000 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { caption } = req.body;
      let imageUrl = '';

      if (req.file) {
        const uploadResponse = await imagekit.upload({
          file: req.file.buffer.toString('base64'),
          fileName: `${Date.now()}-${req.file.originalname}`,
          folder: '/posts'
        });
        imageUrl = uploadResponse.url;
      }
      
      // ⭐ Parse tags from request
      let tags = [];
      if (req.body.tags) {
        try {
          tags = JSON.parse(req.body.tags);
        } catch (e) {
          tags = [];
        }
      }
      
      const post = new Post({ 
        author: req.userId, 
        caption, 
        imageUrl,
        tags  // ⭐ ADD TAGS!
      });
      
      await post.save();
      await post.populate('author', '-password');
      res.json(post);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Helper: get viewer id from Authorization header if present (optional)
function getViewerIdFromHeader(req) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

// GET /api/posts - feed (optional ?author=userid or ?tag=tagname)
// Visibility: posts are visible only to followers (Instagram model). If a viewer is not a follower
// of the author (and not the author themself), they receive an empty array for that author's posts.
// For the main feed (no author param), authenticated viewers see posts from users they follow + their own posts.
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const viewerId = getViewerIdFromHeader(req);

    // tag filter still applies
    if (req.query.tag) filter.tags = { $in: [req.query.tag.toLowerCase()] };

    if (req.query.author) {
      // Viewing a specific user's profile posts
      const authorId = req.query.author;
      // If viewer is author, allow
      if (viewerId && String(viewerId) === String(authorId)) {
        filter.author = authorId;
      } else {
        // Check whether viewer is in author's followers
        const author = await User.findById(authorId).select('followers');
        if (!author) return res.status(404).json([]);
        const isFollower = viewerId && (author.followers || []).some(f => String(f) === String(viewerId));
        if (!isFollower) return res.json({ private: true }); // not allowed to see posts
        filter.author = authorId;
      }
    } else {
      // Main feed: only show posts from users the viewer follows (and their own posts)
      if (!viewerId) return res.json([]);
      const viewer = await User.findById(viewerId).select('following');
      const authors = (viewer.following || []).map(f => String(f));
      authors.push(String(viewerId));
      filter.author = { $in: authors };
    }

    const posts = await Post.find(filter)
      .populate('author', '-password')
      .sort({ createdAt: -1 });
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

// PUT /api/posts/:id - update caption, image, or tags (protected)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.author) !== String(req.userId)) 
      return res.status(403).json({ message: 'Forbidden' });

    if (req.body.caption !== undefined) post.caption = req.body.caption;
    
    // ⭐ Update tags if provided
    if (req.body.tags) {
      try {
        post.tags = JSON.parse(req.body.tags);
      } catch (e) {
        // ignore
      }
    }

    // if (req.file) {
    //   if (post.imageUrl) {
    //     try {
    //       const oldPath = path.join(__dirname, '..', post.imageUrl.replace(/^\//, ''));
    //       await fs.unlink(oldPath).catch(() => {});
    //     } catch (err) {
    //       // ignore
    //     }
    //   }
    //   post.imageUrl = `/uploads/${req.file.filename}`;
    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: req.file.buffer.toString('base64'),
        fileName: `${Date.now()}-${req.file.originalname}`,
        folder: '/posts'
      });
      post.imageUrl = uploadResponse.url;
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

    if (String(post.author) !== String(req.userId)) 
      return res.status(403).json({ message: 'Forbidden: only author can delete this post' });

    // if (post.imageUrl) {
    //   try {
    //     const relativePath = post.imageUrl.replace(/^\//, '');
    //     const imagePath = path.join(__dirname, '..', relativePath);
    //     await fs.unlink(imagePath).catch(() => {});
    //   } catch (err) {
    //     // ignore
    //   }
    // }

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

    // Check current state
    const alreadyLiked = post.likes.some(id => String(id) === userId);
    let updatedPost;
    if (!alreadyLiked) {
      updatedPost = await Post.findByIdAndUpdate(req.params.id, { $addToSet: { likes: userId } }, { new: true });
      try {
        if (String(post.author) !== String(req.userId)) {
          const Notification = require('../models/Notification');
          const payload = { type: 'like', actor: req.userId, recipient: post.author, post: req.params.id };
          console.debug('Creating notification for like with payload:', payload);
          const notif = await Notification.create(payload);
          console.debug('Like notification created:', notif && notif._id);
        }
      } catch (e) {
        console.error('Failed to create notification for like:', e && e.message ? e.message : e);
      }
      return res.json({ likes: updatedPost.likes.length, liked: true });
    } else {
      updatedPost = await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: userId } }, { new: true });
      return res.json({ likes: updatedPost.likes.length, liked: false });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
