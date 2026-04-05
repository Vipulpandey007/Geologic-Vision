const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { sendOtp, verifyOtp } = require('../utils/otp.service');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

// ─── Student Auth (OTP Flow) ───────────────────────────────────────────────────

/**
 * POST /api/auth/student/send-otp
 * Send OTP to student's phone number
 */
async function studentSendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new AppError('Valid phone number with country code is required (e.g., +919876543210)', 400);
    }

    const result = await sendOtp(phone);

    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      expiresAt: result.expiresAt,
      isNewUser: result.isNewUser,  // frontend uses this to show name field
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/student/verify-otp
 * Verify OTP and return JWT tokens
 */
async function studentVerifyOtp(req, res, next) {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) {
      throw new AppError('Phone and OTP are required', 400);
    }

    const result = await verifyOtp(phone, otp, name);
    if (!result.valid) {
      throw new AppError(result.message, 401);
    }

    const tokens = generateTokenPair(result.user);
    const isNewUser = !result.user.name && !name; // still no name after verify

    res.json({
      success: true,
      message: result.user.name ? `Welcome, ${result.user.name}!` : 'Login successful',
      isNewUser: !!result.user.name === false && !name,
      user: {
        id: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
        role: result.user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Admin Auth (Email/Password) ───────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Admin login with email and password
 */
async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, email: true, role: true, name: true, isActive: true, passwordHash: true }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account has been disabled', 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      message: 'Admin login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Shared Auth ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * This reduces OTP cost - user stays logged in up to 30 days
 */
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
    });

    if (!user) {
      throw new AppError('User not found', 401);
    }

    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      message: 'Token refreshed',
      ...tokens,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token expired. Please login again.', 401));
    }
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get current user profile
 */
async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, phone: true, email: true, name: true, role: true, createdAt: true,
        purchases: {
          include: { course: { select: { id: true, title: true } } }
        }
      },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/auth/profile
 * Update user profile (name)
 */
async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, phone: true, email: true, role: true },
    });

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
}

module.exports = { 
  studentSendOtp, 
  studentVerifyOtp, 
  adminLogin, 
  refreshToken,
  getMe,
  updateProfile 
};
