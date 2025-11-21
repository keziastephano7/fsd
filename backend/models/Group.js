const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Ensure creator is always part of members list when group is created
GroupSchema.pre('save', function (next) {
  if (this.isNew) {
    const creatorId = String(this.createdBy);
    this.members = Array.from(new Set([creatorId, ...this.members.map((id) => String(id))]));
  }
  next();
});

module.exports = mongoose.model('Group', GroupSchema);

