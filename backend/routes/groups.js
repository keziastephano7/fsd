const express = require('express');
const { body, validationResult, param } = require('express-validator');
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const GroupInvite = require('../models/GroupInvite');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

// Create a new group
router.post(
  '/',
  auth,
  [body('name').trim().notEmpty().withMessage('Group name is required'), body('description').optional().trim().isLength({ max: 500 })],
  async (req, res) => {
    const errorResponse = handleValidationErrors(req, res);
    if (errorResponse) return errorResponse;

    try {
      const { name, description = '' } = req.body;

      const existing = await Group.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (existing) {
        return res.status(400).json({ message: 'Group with this name already exists' });
      }

      const group = await Group.create({
        name,
        description,
        createdBy: req.userId,
        members: [req.userId]
      });

      // Add group to creator's groups array
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { groups: group._id }
      });

      const populated = await Group.findById(group._id)
        .populate('members', 'name email avatarUrl')
        .populate('createdBy', 'name email avatarUrl');
      res.status(201).json(populated);
    } catch (err) {
      console.error('Error creating group:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// List groups where the user is a member
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('members', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl')
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List invites for the current user
router.get('/invites', auth, async (req, res) => {
  try {
    const invites = await GroupInvite.find({ invitee: req.userId, status: 'pending' })
      .populate('group', 'name description')
      .populate('inviter', 'name email');
    res.json(invites);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Respond to an invite
router.post(
  '/invites/:inviteId/respond',
  auth,
  [param('inviteId').isMongoId(), body('action').isIn(['accept', 'decline']).withMessage('Invalid action')],
  async (req, res) => {
    const errorResponse = handleValidationErrors(req, res);
    if (errorResponse) return errorResponse;

    const { inviteId } = req.params;
    const { action } = req.body;

    try {
      const invite = await GroupInvite.findById(inviteId).populate('group');
      if (!invite || String(invite.invitee) !== String(req.userId)) {
        return res.status(404).json({ message: 'Invite not found' });
      }
      if (invite.status !== 'pending') {
        return res.status(400).json({ message: 'Invite already processed' });
      }

      if (action === 'accept') {
        // Add user to group members
        await Group.findByIdAndUpdate(invite.group._id, { 
          $addToSet: { members: invite.invitee } 
        });
        
        // Add group to user's groups array
        await User.findByIdAndUpdate(invite.invitee, {
          $addToSet: { groups: invite.group._id }
        });
        
        invite.status = 'accepted';
      } else {
        invite.status = 'declined';
      }

      await invite.save();
      // notify the inviter about the response (accept/decline)
      try {
        const payload = {
          type: 'group_invite_response',
          actor: req.userId, // the invitee who responded
          recipient: invite.inviter,
          group: invite.group._id || invite.group,
          invite: invite._id,
          action: action
        };
        const respNotif = await Notification.create(payload);
        console.debug('Group invite response notification created:', respNotif && respNotif._id);
      } catch (e) {
        console.error('Failed to create invite response notification:', e && e.message ? e.message : e);
      }

      res.json({ message: `Invite ${action}ed successfully` });
    } catch (err) {
      console.error('Error responding to invite:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get group details (must be a member)
router.get('/:groupId', auth, [param('groupId').isMongoId()], async (req, res) => {
  const errorResponse = handleValidationErrors(req, res);
  if (errorResponse) return errorResponse;

  try {
    const group = await Group.findOne({ _id: req.params.groupId, members: req.userId })
      .populate('members', 'name email avatarUrl')
      .populate('createdBy', 'name email avatarUrl');
    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' });
    }
    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite a member to group
router.post(
  '/:groupId/invite',
  auth,
  [
    param('groupId').isMongoId(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
  ],
  async (req, res) => {
    const errorResponse = handleValidationErrors(req, res);
    if (errorResponse) return errorResponse;

    const { groupId } = req.params;
    const { email } = req.body;

    try {
      const group = await Group.findById(groupId);
      if (!group || !group.members.some((m) => String(m) === String(req.userId))) {
        return res.status(403).json({ message: 'You must be a group member to invite others' });
      }

      const invitee = await User.findOne({ email });
      if (!invitee) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (group.members.some((m) => String(m) === String(invitee._id))) {
        return res.status(400).json({ message: 'User is already a member of this group' });
      }

      const existingInvite = await GroupInvite.findOne({
        group: groupId,
        invitee: invitee._id,
        status: 'pending'
      });

      if (existingInvite) {
        return res.status(400).json({ message: 'An invite has already been sent to this user' });
      }

      const invite = await GroupInvite.create({
        group: groupId,
        inviter: req.userId,
        invitee: invitee._id
      });

      const populatedInvite = await invite.populate([
        { path: 'group', select: 'name description' },
        { path: 'invitee', select: 'name email' }
      ]);

      // Create a notification for the invitee so they are notified of the group invite
      let notif = null;
      try {
        const payload = {
          type: 'group_invite',
          actor: req.userId,
          recipient: invitee._id,
          group: groupId,
          invite: invite._id
        };
        notif = await Notification.create(payload);
        console.debug('Group invite notification created:', notif && notif._id);
      } catch (e) {
        console.error('Failed to create group invite notification:', e && e.message ? e.message : e);
      }

      // Return the invite and created notification id (if any) to the caller
      res.status(201).json({ invite: populatedInvite, notificationId: notif?._id || null });
    } catch (err) {
      console.error('Error inviting member:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Remove a member or allow a member to leave
router.delete('/:groupId/members/:memberId', auth, [param('groupId').isMongoId(), param('memberId').isMongoId()], async (req, res) => {
  const errorResponse = handleValidationErrors(req, res);
  if (errorResponse) return errorResponse;

  const { groupId, memberId } = req.params;

  try {
    const group = await Group.findById(groupId);
    if (!group || !group.members.some((m) => String(m) === String(req.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const removingSelf = String(memberId) === String(req.userId);
    const isOwner = String(group.createdBy) === String(req.userId);

    if (!removingSelf && !isOwner) {
      return res.status(403).json({ message: 'Only the group creator can remove other members' });
    }

    group.members = group.members.filter((m) => String(m) !== String(memberId));
    await group.save();

    // Remove group from user's groups array
    await User.findByIdAndUpdate(memberId, {
      $pull: { groups: groupId }
    });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;