const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Generate token pair AND save session to DB
 * Embeds sessionId in the access token so we can check revocation per request
 */
async function generateTokenPair(user, deviceInfo = null, ipAddress = null) {
  const { prisma } = require("../config/database");

  const MAX_SESSIONS = parseInt(process.env.MAX_SESSIONS_PER_USER) || 5;

  // Count existing active sessions
  const activeSessions = await prisma.session.findMany({
    where: { userId: user.id, isRevoked: false },
    orderBy: { createdAt: "asc" },
  });

  // Revoke oldest sessions if at limit
  if (activeSessions.length >= MAX_SESSIONS) {
    const toRevoke = activeSessions.slice(
      0,
      activeSessions.length - MAX_SESSIONS + 1,
    );
    await prisma.session.updateMany({
      where: { id: { in: toRevoke.map((s) => s.id) } },
      data: { isRevoked: true },
    });
  }

  // Create session record first to get sessionId
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      deviceInfo: deviceInfo || "Unknown device",
      ipAddress,
      lastActiveAt: new Date(),
    },
  });

  // Embed sessionId in access token — this is the key to force logout
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
    phone: user.phone,
    email: user.email,
    sessionId: session.id, // ← embedded so we can check revocation
  });

  return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
