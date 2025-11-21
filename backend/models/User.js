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
  otpExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);