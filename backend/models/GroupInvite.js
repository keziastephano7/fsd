const mongoose = require('mongoose');

const GroupInviteSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  },
  { timestamps: true }
);

GroupInviteSchema.index({ group: 1, invitee: 1, status: 1 });

module.exports = mongoose.model('GroupInvite', GroupInviteSchema);

