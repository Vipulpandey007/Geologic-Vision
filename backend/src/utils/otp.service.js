const twilio = require('twilio');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const { logger } = require('./logger');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a 6-digit OTP
 */
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via SMS
 * Returns isNewUser = true if this phone hasn't registered before
 */
async function sendOtp(phone) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !existingUser;

  // Upsert user (create if doesn't exist — name will be set later on verify)
  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone, role: 'STUDENT' },
  });

  // Invalidate all previous unused OTPs for this phone
  await prisma.otpRecord.updateMany({
    where: { phone, isUsed: false },
    data: { isUsed: true },
  });

  // Create new OTP record
  await prisma.otpRecord.create({
    data: {
      userId: user.id,
      phone,
      otp,
      expiresAt,
    },
  });

  // Send SMS
  if (process.env.NODE_ENV === 'production') {
    await client.messages.create({
      body: `Your EduPlatform OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
  } else {
    // Dev mode: log OTP to terminal
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
  }

  return { userId: user.id, expiresAt, isNewUser };
}

/**
 * Verify OTP
 * If name is provided and user has no name yet, save it (signup flow)
 */
async function verifyOtp(phone, otp, name) {
  const record = await prisma.otpRecord.findFirst({
    where: {
      phone,
      otp,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as used
  await prisma.otpRecord.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  // If name provided and user doesn't have one yet, save it
  let user = record.user;
  if (name && name.trim() && !user.name) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });
  }

  return { valid: true, user };
}

module.exports = { sendOtp, verifyOtp };
