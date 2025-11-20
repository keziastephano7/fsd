const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

const multer = require('multer');

const imagekit = require('../config/imagekit');


// const path = require('path');
// const fs = require('fs').promises;

// // Multer setup for avatars
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
//     try {
//       await fs.mkdir(uploadPath, { recursive: true }); // create folder if not exists
//       cb(null, uploadPath);
//     } catch (err) {
//       cb(err);
//     }
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

const upload = multer({
  storage: multer.memoryStorage(),
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

// GET /api/users/:id/followers - list followers (owner or followers-only)
const jwt = require('jsonwebtoken');

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

router.get('/:id/followers', async (req, res) => {
  try {
    const targetId = req.params.id;
    // Public: return followers with pagination
    const user = await User.findById(targetId).select('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Pagination support: ?page=0&limit=20
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const skip = page * limit;

    const followerIds = (user.followers || []).map(id => String(id));
    const total = followerIds.length;

    const items = await User.find({ _id: { $in: followerIds } })
      .select('name avatarUrl _id')
      .skip(skip)
      .limit(limit);

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('Error fetching followers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/following - list following (owner or followers-only)
router.get('/:id/following', async (req, res) => {
  try {
    const targetId = req.params.id;
    const user = await User.findById(targetId).select('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const viewerId = getViewerIdFromHeader(req);
    const isOwner = viewerId && String(viewerId) === String(targetId);
    const isFollower = viewerId && (user.followers || []).some(f => String(f) === String(viewerId));

    if (!isOwner && !isFollower) {
      return res.status(403).json({ private: true });
    }

    // Pagination support: ?page=0&limit=20
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const skip = page * limit;

    // get following ids from user.following
    const full = await User.findById(targetId).select('following');
    const followingIds = (full.following || []).map(id => String(id));
    const total = followingIds.length;

    const items = await User.find({ _id: { $in: followingIds } })
      .select('name avatarUrl _id')
      .skip(skip)
      .limit(limit);

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('Error fetching following:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// // PUT /api/users/:id - edit profile (protected)
// router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
//   try {
//     if (req.userId !== req.params.id)
//       return res.status(403).json({ message: 'Forbidden' });

//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Update text fields
//     if (req.body.name !== undefined) user.name = req.body.name;
//     if (req.body.bio !== undefined) user.bio = req.body.bio;

//     // If a new avatar was uploaded
//     if (req.file) {
//       if (user.avatarUrl) {
//         try {
//           const oldPath = path.join(__dirname, '..', user.avatarUrl.replace(/^\//, ''));
//           await fs.unlink(oldPath).catch(() => {});
//         } catch (err) {
//           // ignore
//         }
//       }
//       user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
//     }

//     await user.save();
//     res.json({ id: user._id, name: user.name, bio: user.bio, avatarUrl: user.avatarUrl });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// 🧠 PUT /api/users/:id - edit profile (protected)
router.put('/:id', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ message: 'Forbidden' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update text fields
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    // 🖼️ If a new avatar was uploaded
    if (req.file) {
      // Delete old avatar from ImageKit if exists (optional)
      if (user.avatarFileId) {
        try {
          await imagekit.deleteFile(user.avatarFileId);
        } catch (err) {
          console.warn('Old avatar delete failed:', err.message);
        }
      }

      // Upload new avatar to ImageKit
      const uploadResult = await imagekit.upload({
        file: req.file.buffer.toString('base64'), // convert to base64
        fileName: `${Date.now()}-${req.file.originalname}`,
        folder: '/avatars', // optional folder in ImageKit
      });

      // Update user with new URL and file ID
      user.avatarUrl = uploadResult.url;
      user.avatarFileId = uploadResult.fileId; // for future deletion
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/:id/follow - follow a user
router.put('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    if (currentId === targetId) return res.status(400).json({ message: "Cannot follow yourself" });

    const UserModel = User; // alias

    // Use atomic operators to avoid duplicates
    const [updatedTarget, updatedCurrent] = await Promise.all([
      UserModel.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } }, { new: true }).select('-password'),
      UserModel.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } }, { new: true }).select('-password')
    ]);

    if (!updatedTarget || !updatedCurrent) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Followed', target: { id: updatedTarget._id, followersCount: updatedTarget.followers.length },
      current: { id: updatedCurrent._id, followingCount: updatedCurrent.following.length } });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/users/:id/unfollow - unfollow a user
router.put('/:id/unfollow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    if (currentId === targetId) return res.status(400).json({ message: "Cannot unfollow yourself" });

    const UserModel = User;

    const [updatedTarget, updatedCurrent] = await Promise.all([
      UserModel.findByIdAndUpdate(targetId, { $pull: { followers: currentId } }, { new: true }).select('-password'),
      UserModel.findByIdAndUpdate(currentId, { $pull: { following: targetId } }, { new: true }).select('-password')
    ]);

    if (!updatedTarget || !updatedCurrent) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Unfollowed', target: { id: updatedTarget._id, followersCount: updatedTarget.followers.length },
      current: { id: updatedCurrent._id, followingCount: updatedCurrent.following.length } });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;