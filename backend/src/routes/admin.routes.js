const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalCourses, totalStudents, totalRevenue, recentPurchases] = await Promise.all([
      prisma.course.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
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
        totalCourses,
        totalStudents,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentPurchases,
      },
    });
  } catch (error) {
    next(error);
  }
});

// List all students
router.get('/students', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      role: 'STUDENT',
      ...(search && {
        OR: [
          { phone: { contains: search } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, name: true, email: true, createdAt: true, isActive: true,
          _count: { select: { purchases: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, students, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

// Toggle student active status
router.patch('/students/:id/toggle', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });

    res.json({ success: true, message: `User ${updated.isActive ? 'activated' : 'deactivated'}`, isActive: updated.isActive });
  } catch (error) {
    next(error);
  }
});

// Seed admin (used only once or via CLI)
router.post('/seed', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role: 'ADMIN', passwordHash: hash },
    });
    res.json({ success: true, message: 'Admin seeded', adminId: admin.id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
