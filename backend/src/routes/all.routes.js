// ============================================================
// FILE: src/routes/auth.routes.js
// ============================================================
const express = require('express');
const router = express.Router();
const { 
  studentSendOtp, studentVerifyOtp, adminLogin, 
  refreshToken, getMe, updateProfile 
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Student OTP routes
router.post('/student/send-otp', studentSendOtp);
router.post('/student/verify-otp', studentVerifyOtp);

// Admin routes
router.post('/admin/login', adminLogin);

// Shared
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

module.exports = router;


// ============================================================
// FILE: src/routes/course.routes.js
// ============================================================
const express2 = require('express');
const router2 = express2.Router();
const { 
  getAllCourses, getCourse, createCourse, updateCourse, 
  deleteCourse, getAllCoursesAdmin 
} = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadThumbnail } = require('../config/s3');

// Public
router2.get('/', getAllCourses);
router2.get('/:id', getCourse);

// Admin only
router2.get('/admin/all', authenticate, authorize('ADMIN'), getAllCoursesAdmin);
router2.post('/', authenticate, authorize('ADMIN'), uploadThumbnail.single('thumbnail'), createCourse);
router2.put('/:id', authenticate, authorize('ADMIN'), uploadThumbnail.single('thumbnail'), updateCourse);
router2.delete('/:id', authenticate, authorize('ADMIN'), deleteCourse);

module.exports = router2;


// ============================================================
// FILE: src/routes/chapter.routes.js
// ============================================================
const express3 = require('express');
const router3 = express3.Router();
const { 
  getChaptersByCourse, createChapter, updateChapter, 
  deleteChapter, reorderChapters 
} = require('../controllers/chapter.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Authenticated users (purchase check handled in PDF route)
router3.get('/course/:courseId', authenticate, getChaptersByCourse);

// Admin only
router3.post('/', authenticate, authorize('ADMIN'), createChapter);
router3.put('/:id', authenticate, authorize('ADMIN'), updateChapter);
router3.delete('/:id', authenticate, authorize('ADMIN'), deleteChapter);
router3.patch('/reorder', authenticate, authorize('ADMIN'), reorderChapters);

module.exports = router3;


// ============================================================
// FILE: src/routes/pdf.routes.js
// ============================================================
const express4 = require('express');
const router4 = express4.Router();
const { uploadPdf: uploadPdfController, getPdfSignedUrl, deletePdf, updatePdf } = require('../controllers/pdf.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadPdf } = require('../config/s3');

// Get signed URL (any authenticated user - purchase check inside controller)
router4.get('/:id/view', authenticate, getPdfSignedUrl);

// Admin only
router4.post('/upload/:chapterId', authenticate, authorize('ADMIN'), uploadPdf.single('pdf'), uploadPdfController);
router4.put('/:id', authenticate, authorize('ADMIN'), updatePdf);
router4.delete('/:id', authenticate, authorize('ADMIN'), deletePdf);

module.exports = router4;


// ============================================================
// FILE: src/routes/payment.routes.js
// ============================================================
const express5 = require('express');
const router5 = express5.Router();
const { createOrder, verifyPayment, getMyPurchases, getPaymentHistory } = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router5.post('/create-order', authenticate, createOrder);
router5.post('/verify', authenticate, verifyPayment);
router5.get('/my-purchases', authenticate, getMyPurchases);

// Admin
router5.get('/history', authenticate, authorize('ADMIN'), getPaymentHistory);

module.exports = router5;


// ============================================================
// FILE: src/routes/admin.routes.js
// ============================================================
const express6 = require('express');
const router6 = express6.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { prisma } = require('../config/database');

// Admin dashboard stats
router6.get('/stats', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const [totalStudents, totalCourses, totalRevenue, recentPurchases] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.purchase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true, name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalCourses,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentPurchases,
      },
    });
  } catch (error) {
    next(error);
  }
});

// List all users
router6.get('/users', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search
      ? { OR: [{ phone: { contains: search } }, { name: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: { ...where, role: 'STUDENT' },
        select: { id: true, phone: true, email: true, name: true, createdAt: true, isActive: true,
          _count: { select: { purchases: true } } },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { ...where, role: 'STUDENT' } }),
    ]);

    res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

module.exports = router6;
