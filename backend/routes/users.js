const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Multer setup for avatars
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
    try {
      await fs.mkdir(uploadPath, { recursive: true }); // create folder if not exists
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ok = allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only JPG/PNG images allowed'), ok);
  }
});

// ⭐ IMPORTANT: /search MUST come BEFORE /:id
// Search users by name or email
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    // Search for users matching the query
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('name email avatarUrl _id')
    .limit(10);

    res.json(users);
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
});

// GET /api/users/:id - get profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - edit profile (protected)
router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ message: 'Forbidden' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update text fields
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    // If a new avatar was uploaded
    if (req.file) {
      if (user.avatarUrl) {
        try {
          const oldPath = path.join(__dirname, '..', user.avatarUrl.replace(/^\//, ''));
          await fs.unlink(oldPath).catch(() => {});
        } catch (err) {
          // ignore
        }
      }
      user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();
    res.json({ id: user._id, name: user.name, bio: user.bio, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;