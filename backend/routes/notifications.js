const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// GET /api/notifications - list notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('actor', 'name avatarUrl')
      .populate('post', '_id caption imageUrl')
      .populate('comment', 'text')
      .populate('group', 'name')
      .populate('invite', 'status')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read - mark as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (String(notification.recipient) !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    notification.read = true;
    await notification.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    console.error('Error marking notification read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Not found' });
    if (String(notification.recipient) !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    await notification.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
