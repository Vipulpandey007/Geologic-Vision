const crypto = require('crypto');
const { prisma } = require('../config/database');
const { razorpay, verifyPaymentSignature } = require('../config/razorpay');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * POST /api/payments/create-order
 * Create Razorpay order for course purchase
 */
async function createOrder(req, res, next) {
  try {
    const { courseId } = req.body;
    if (!courseId) throw new AppError('Course ID is required', 400);

    const course = await prisma.course.findUnique({
      where: { id: courseId, isPublished: true },
    });

    if (!course) throw new AppError('Course not found', 404);
    if (course.isFree) throw new AppError('This course is free. No payment required.', 400);

    // Check if already purchased
    const existingPurchase = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } }
    });

    if (existingPurchase) {
      throw new AppError('You have already purchased this course', 409);
    }

    // Create Razorpay order
    const amount = Math.round(course.price * 100); // in paise
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${req.user.id}_${courseId}`.slice(0, 40),
      notes: {
        userId: req.user.id,
        courseId: course.id,
        courseName: course.title,
      },
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        userId: req.user.id,
        courseId,
        razorpayOrderId: razorpayOrder.id,
        amount: course.price,
        status: 'PENDING',
      }
    });

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      course: {
        id: course.id,
        title: course.title,
        price: course.price,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and unlock course
 */
async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('All payment fields are required', 400);
    }

    // Verify signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      // Mark payment as failed
      await prisma.payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' },
      });
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (!payment) throw new AppError('Payment record not found', 404);

    // Update payment and create purchase in a transaction
    await prisma.$transaction([
      prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'SUCCESS',
        },
      }),
      prisma.purchase.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId,
          expiryDate: null, // Lifetime access
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Payment verified! Course unlocked successfully.',
      courseId: payment.courseId,
    });
  } catch (error) {
    // Handle unique constraint (already purchased)
    if (error.code === 'P2002') {
      return res.json({
        success: true,
        message: 'Course already unlocked.',
      });
    }
    next(error);
  }
}

/**
 * GET /api/payments/my-purchases
 * Get user's purchased courses
 */
async function getMyPurchases(req, res, next) {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.id },
      include: {
        course: {
          select: {
            id: true, title: true, description: true, thumbnail: true,
            _count: { select: { chapters: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, purchases });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/history  [ADMIN]
 * Get all payments (admin)
 */
async function getPaymentHistory(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status: status.toUpperCase() } : {};

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        include: {
          user: { select: { id: true, phone: true, email: true, name: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { createOrder, verifyPayment, getMyPurchases, getPaymentHistory };
