const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/admin/stats
 */
async function getDashboardStats(req, res, next) {
  try {
    const [totalUsers, totalCourses, totalRevenue, recentPurchases] = await prisma.$transaction([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.purchase.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { phone: true, email: true, name: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalRevenue: totalRevenue._sum.amount || 0,
        recentPurchases,
      },
    });
  } catch (error) { next(error); }
}

/**
 * POST /api/admin/seed  - Create initial admin user
 */
async function seedAdmin(req, res, next) {
  try {
    const { secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SEED_SECRET) throw new AppError('Invalid secret key', 403);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.json({ success: true, message: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { email, role: 'ADMIN', name: 'Admin', passwordHash } });
    res.json({ success: true, message: 'Admin created' });
  } catch (error) { next(error); }
}

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { role: 'STUDENT' };
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: { id: true, phone: true, email: true, name: true, createdAt: true, isActive: true, _count: { select: { purchases: true } } },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
}

module.exports = { getDashboardStats, seedAdmin, getUsers };
