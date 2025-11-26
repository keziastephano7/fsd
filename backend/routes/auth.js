const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const { generateOTP, sendOTPEmail } = require('../services/emailService');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;

      // Check if user exists REGARDLESS of verification status
      let existingUser = await User.findOne({ email });
      
      if (existingUser) {
        if (existingUser.isEmailVerified) {
          return res.status(400).json({ message: 'User already exists. Please login.' });
        } else {
          // User exists but not verified - update their details and send new OTP
          const otp = generateOTP();
          const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

          const salt = await bcrypt.genSalt(10);
          const hashed = await bcrypt.hash(password, salt);

          existingUser.name = name;
          existingUser.password = hashed;
          existingUser.emailVerificationOTP = otp;
          existingUser.otpExpires = otpExpires;
          await existingUser.save();

          // Send new OTP email
          await sendOTPEmail(email, otp, name);

          return res.status(200).json({
            message: 'Verification OTP sent again. Please verify your email.',
            email,
            isResend: true
          });
        }
      }

      // New user - create unverified record
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email,
        password: hashed,
        isEmailVerified: false,
        emailVerificationOTP: otp,
        otpExpires,
      });

      await user.save();

      // Send OTP email
      await sendOTPEmail(email, otp, name);

      return res.status(200).json({
        message: 'Registration successful. Please verify your email using the OTP sent.',
        email,
      });
    } catch (err) {
      console.error('Error in register:', err);
      
      // Handle duplicate key error (unique email constraint)
      if (err.code === 11000) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });

      // Block login if email not verified
      if (!user.isEmailVerified) {
        return res.status(400).json({ message: 'Please verify your email before logging in.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

      // Token expiration: default 10m for testing, can be set to 1h for production via JWT_EXPIRES env var
      const tokenExpires = process.env.JWT_EXPIRES || '1m';
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: tokenExpires });
      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl },
      });
    } catch (err) {
      console.error('Error in login:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('otp').isLength({ min: 4 }).withMessage('OTP is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      if (!user.emailVerificationOTP || !user.otpExpires) {
        return res.status(400).json({ message: 'No OTP request found' });
      }

      if (user.otpExpires < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      }

      if (user.emailVerificationOTP !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Mark as verified and clear OTP
      user.isEmailVerified = true;
      user.emailVerificationOTP = null;
      user.otpExpires = null;
      await user.save();

      // Issue JWT token now
      const tokenExpires = process.env.JWT_EXPIRES || '1m';
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: tokenExpires });

      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (err) {
      console.error('Error in verify-otp:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/auth/resend-otp
router.post(
  '/resend-otp',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      user.emailVerificationOTP = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendOTPEmail(email, otp, user.name);

      return res.json({ message: 'New OTP sent to your email.' });
    } catch (err) {
      console.error('Error in resend-otp:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/auth/me-with-groups - Get current user WITH groups
router.get('/me-with-groups', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('groups', 'name _id') // Populate groups
      .select('-password -emailVerificationOTP -otpExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      groups: user.groups || []
    });
  } catch (error) {
    console.error('Error in /me-with-groups:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;