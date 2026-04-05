const express = require('express');
const router = express.Router();
const {
  studentSendOtp,
  studentVerifyOtp,
  adminLogin,
  refreshToken,
  getMe,
  updateProfile,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Student OTP flow
router.post('/student/send-otp', studentSendOtp);
router.post('/student/verify-otp', studentVerifyOtp);

// Admin email/password
router.post('/admin/login', adminLogin);

// Shared
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

module.exports = router;
