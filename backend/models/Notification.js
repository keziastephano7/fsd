const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // types: like, comment, group_invite (when someone is invited to a group),
  // group_invite_response (when invitee accepts/declines and inviter should be notified)
  type: { type: String, enum: ['like', 'comment', 'group_invite', 'group_invite_response'], required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  // group related fields
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  invite: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupInvite' },
  // optional action for response notifications (e.g., 'accept' or 'decline')
  action: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
