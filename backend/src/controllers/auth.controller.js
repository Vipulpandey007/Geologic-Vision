const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");
const { sendOtp, verifyOtp } = require("../utils/otp.service");
const { generateTokenPair, verifyRefreshToken } = require("../utils/jwt");
const { AppError } = require("../middleware/errorHandler");

// ─── Helper: extract device info from request ─────────────────────────────────
function getDeviceInfo(req) {
  const ua = req.headers["user-agent"] || "";
  if (ua.includes("Mobile")) return `Mobile — ${ua.slice(0, 80)}`;
  if (ua.includes("Chrome")) return `Chrome — ${ua.slice(0, 80)}`;
  if (ua.includes("Firefox")) return `Firefox — ${ua.slice(0, 80)}`;
  if (ua.includes("Safari")) return `Safari — ${ua.slice(0, 80)}`;
  return ua.slice(0, 80) || "Unknown device";
}

function getIpAddress(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    null
  );
}

// ─── Student Auth ──────────────────────────────────────────────────────────────

async function studentSendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new AppError(
        "Valid phone number with country code is required",
        400,
      );
    }
    const result = await sendOtp(phone);
    res.json({
      success: true,
      message: `OTP sent to ${phone}`,
      expiresAt: result.expiresAt,
      isNewUser: result.isNewUser,
    });
  } catch (error) {
    next(error);
  }
}

async function studentVerifyOtp(req, res, next) {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) throw new AppError("Phone and OTP are required", 400);

    const result = await verifyOtp(phone, otp, name);
    if (!result.valid) throw new AppError(result.message, 401);

    const tokens = await generateTokenPair(
      result.user,
      getDeviceInfo(req),
      getIpAddress(req),
    );

    res.json({
      success: true,
      message: result.user.name
        ? `Welcome, ${result.user.name}!`
        : "Login successful",
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

// ─── Admin Auth ────────────────────────────────────────────────────────────────

async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new AppError("Email and password are required", 400);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user || user.role !== "ADMIN")
      throw new AppError("Invalid credentials", 401);
    if (!user.isActive) throw new AppError("Account has been disabled", 403);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

    const tokens = await generateTokenPair(
      user,
      getDeviceInfo(req),
      getIpAddress(req),
    );

    res.json({
      success: true,
      message: "Admin login successful",
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

// ─── Shared ───────────────────────────────────────────────────────────────────

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token is required", 400);

    // Check if session exists and is not revoked
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.isRevoked) {
      throw new AppError(
        "Session expired or revoked. Please login again.",
        401,
      );
    }

    if (!session.user.isActive) {
      throw new AppError("Account has been disabled", 403);
    }

    // Verify token signature
    verifyRefreshToken(refreshToken);

    // Update last active
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    const tokens = await generateTokenPair(
      session.user,
      session.deviceInfo,
      session.ipAddress,
    );

    // Revoke old session
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    res.json({ success: true, message: "Token refreshed", ...tokens });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Session expired. Please login again.", 401));
    }
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.session.updateMany({
        where: { refreshToken, userId: req.user.id },
        data: { isRevoked: true },
      });
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        purchases: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
    });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: { id: true, name: true, phone: true, email: true, role: true },
    });
    res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  studentSendOtp,
  studentVerifyOtp,
  adminLogin,
  refreshToken,
  logout,
  getMe,
  updateProfile,
};
