const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Group = require('../models/Group');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const imagekit = require('../config/imagekit');  

function extractUserId(req) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

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
      const { caption, visibility = 'public' } = req.body;
      let imageUrl = '';
      if (!['public', 'groups'].includes(visibility)) {
        return res.status(400).json({ message: 'Invalid visibility option' });
      }

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
      
      let targetGroups = [];
      if (visibility === 'groups') {
        if (!req.body.targetGroups) {
          return res.status(400).json({ message: 'Please select at least one group for private posts' });
        }
        try {
          targetGroups = JSON.parse(req.body.targetGroups);
        } catch (e) {
          targetGroups = Array.isArray(req.body.targetGroups) ? req.body.targetGroups : [];
        }
        targetGroups = targetGroups.filter(Boolean);
        if (!targetGroups.length) {
          return res.status(400).json({ message: 'Please select at least one group for private posts' });
        }

        const accessibleGroups = await Group.find({
          _id: { $in: targetGroups },
          members: req.userId
        }).select('_id');

        if (accessibleGroups.length !== targetGroups.length) {
          return res.status(403).json({ message: 'You can only post to groups you belong to' });
        }
      }

      const post = new Post({ 
        author: req.userId, 
        caption, 
        imageUrl,
        tags,
        visibility,
        targetGroups
      });
      
      await post.save();
      await post.populate([
        { path: 'author', select: '-password' },
        { path: 'targetGroups', select: 'name' }
      ]);
      res.json(post);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

async function buildVisibilityFilter(viewerId, specificGroupId) {
  const orClauses = [{ visibility: 'public' }];

  if (viewerId) {
    const memberGroups = await Group.find({ members: viewerId }).select('_id');
    const groupIds = memberGroups.map((g) => g._id);
    if (groupIds.length) {
      orClauses.push({ visibility: 'groups', targetGroups: { $in: groupIds } });
    }

    if (specificGroupId) {
      const isMember = groupIds.some((id) => String(id) === String(specificGroupId));
      if (!isMember) {
        throw new Error('not-member');
      }
      return { visibility: 'groups', targetGroups: specificGroupId };
    }
  } else if (specificGroupId) {
    throw new Error('auth-required');
  }

  return { $or: orClauses };
}

// GET /api/posts - feed (optional ?author=userid or ?tag=tagname or ?groupId=)
router.get('/', async (req, res) => {
  try {
    const viewerId = extractUserId(req);
    const { author, tag, groupId } = req.query;

    let filter = {};
    if (author) filter.author = author;
    if (tag) filter.tags = { $in: [tag.toLowerCase()] };

    const visibilityFilter = await buildVisibilityFilter(viewerId, groupId);
    filter = { ...filter, ...visibilityFilter };
    
    const posts = await Post.find(filter)
      .populate('author', '-password')
      .populate('targetGroups', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    if (err.message === 'not-member') {
      return res.status(403).json({ message: 'You must be a member of this group to view its posts' });
    }
    if (err.message === 'auth-required') {
      return res.status(401).json({ message: 'Authentication required to view this group' });
    }
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', '-password')
      .populate('targetGroups', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.visibility === 'groups') {
      const viewerId = extractUserId(req);
      if (!viewerId) {
        return res.status(401).json({ message: 'Authentication required to view this post' });
      }
      const isMember = await Group.exists({ _id: { $in: post.targetGroups }, members: viewerId });
      if (!isMember) {
        return res.status(403).json({ message: 'You do not have access to this post' });
      }
    }

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

    if (req.body.visibility) {
      if (!['public', 'groups'].includes(req.body.visibility)) {
        return res.status(400).json({ message: 'Invalid visibility option' });
      }
      post.visibility = req.body.visibility;
    }

    if (post.visibility === 'groups') {
      let targetGroups = post.targetGroups.map((id) => String(id));
      if (req.body.targetGroups) {
        try {
          targetGroups = JSON.parse(req.body.targetGroups);
        } catch {
          targetGroups = Array.isArray(req.body.targetGroups) ? req.body.targetGroups : targetGroups;
        }
      }
      targetGroups = targetGroups.filter(Boolean);
      if (!targetGroups.length) {
        return res.status(400).json({ message: 'Please select at least one group for private posts' });
      }

      const accessibleGroups = await Group.find({
        _id: { $in: targetGroups },
        members: req.userId
      }).select('_id');

      if (accessibleGroups.length !== targetGroups.length) {
        return res.status(403).json({ message: 'You can only target groups you belong to' });
      }

      post.targetGroups = targetGroups;
    } else if (req.body.visibility === 'public') {
      post.targetGroups = [];
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
    await post.populate([
      { path: 'author', select: '-password' },
      { path: 'targetGroups', select: 'name' }
    ]);
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

// GET /api/posts/:id/likes - list users who liked (enforces group visibility)
router.get('/:id/likes', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate({ path: 'likes', select: 'name username avatarUrl' });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.visibility === 'groups') {
      const viewerId = extractUserId(req);
      if (!viewerId) return res.status(401).json({ message: 'Authentication required to view likes' });
      const isMember = await Group.exists({ _id: { $in: post.targetGroups }, members: viewerId });
      if (!isMember) return res.status(403).json({ message: 'You do not have access to view likes for this post' });
    }

    return res.json({ likers: post.likes });
  } catch (err) {
    console.error('Error fetching likers:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
