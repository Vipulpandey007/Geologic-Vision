const { verifyAccessToken } = require('../utils/jwt');
const { prisma } = require('../config/database');

/**
 * Verify JWT access token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please login.' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, isActive: true },
      select: { id: true, phone: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or account disabled.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
}

/**
 * Role-based access control middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
}

/**
 * Check if student has purchased a course
 */
async function requirePurchase(req, res, next) {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) return next();

    // Admins bypass purchase check
    if (req.user.role === 'ADMIN') return next();

    // Check if course is free
    const course = await prisma.course.findUnique({ 
      where: { id: courseId },
      select: { isFree: true }
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    if (course.isFree) return next();

    // Check purchase record
    const purchase = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId } },
    });

    if (!purchase) {
      return res.status(403).json({ 
        success: false, 
        message: 'Course not purchased. Please buy this course to access content.',
        code: 'PURCHASE_REQUIRED'
      });
    }

    // Check expiry
    if (purchase.expiryDate && purchase.expiryDate < new Date()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your access to this course has expired.',
        code: 'ACCESS_EXPIRED'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate, authorize, requirePurchase };
