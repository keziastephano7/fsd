const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  avatarFileId: { type: String, default: '' },

  // Email verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationOTP: { type: String, default: null },
  otpExpires: { type: Date, default: null },

  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);