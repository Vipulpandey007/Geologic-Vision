const express = require("express");
const router = express.Router();
const { prisma } = require("../config/database");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const bcrypt = require("bcryptjs");

router.use(authenticate, authorize("ADMIN"));

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const [totalCourses, totalStudents, totalRevenue, recentPurchases] =
      await Promise.all([
        prisma.course.count(),
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: "SUCCESS" },
        }),
        prisma.purchase.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
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

// ─── Students ─────────────────────────────────────────────────────────────────
router.get("/students", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      role: "STUDENT",
      ...(search && {
        OR: [
          { phone: { contains: search } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          createdAt: true,
          isActive: true,
          _count: { select: { purchases: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      success: true,
      students,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/students/:id/toggle", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
    });
    res.json({
      success: true,
      message: `User ${updated.isActive ? "activated" : "deactivated"}`,
      isActive: updated.isActive,
    });
  } catch (error) {
    next(error);
  }
});

// ─── Session Management ───────────────────────────────────────────────────────

// Overview — show ALL users with active sessions (not just suspicious)
router.get("/sessions/overview", async (req, res, next) => {
  try {
    const activeSessions = await prisma.session.findMany({
      where: { isRevoked: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by userId
    const userMap = {};
    for (const session of activeSessions) {
      const uid = session.userId;
      if (!userMap[uid]) {
        userMap[uid] = {
          id: session.user.id,
          name: session.user.name,
          phone: session.user.phone,
          email: session.user.email,
          role: session.user.role,
          activeSessions: 0,
        };
      }
      userMap[uid].activeSessions++;
    }

    const allUsers = Object.values(userMap).sort(
      (a, b) => b.activeSessions - a.activeSessions,
    );

    // Split into suspicious (>1) and normal
    const suspiciousUsers = allUsers.filter((u) => u.activeSessions > 1);
    const normalUsers = allUsers.filter((u) => u.activeSessions === 1);

    res.json({
      success: true,
      suspiciousUsers,
      normalUsers,
      totalActiveSessions: activeSessions.length,
    });
  } catch (error) {
    next(error);
  }
});

// Get sessions for a specific user
router.get("/students/:id/sessions", async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.params.id, isRevoked: false },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { lastActiveAt: "desc" },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
});

// Revoke a specific session
router.delete("/sessions/:sessionId", async (req, res, next) => {
  try {
    await prisma.session.update({
      where: { id: req.params.sessionId },
      data: { isRevoked: true },
    });
    res.json({ success: true, message: "Session revoked" });
  } catch (error) {
    next(error);
  }
});

// Revoke ALL sessions for a user
router.delete("/students/:id/sessions", async (req, res, next) => {
  try {
    const { count } = await prisma.session.updateMany({
      where: { userId: req.params.id, isRevoked: false },
      data: { isRevoked: true },
    });
    res.json({ success: true, message: `${count} session(s) revoked` });
  } catch (error) {
    next(error);
  }
});

// ─── Seed admin ───────────────────────────────────────────────────────────────
router.post("/seed", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const admin = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, role: "ADMIN", passwordHash: hash },
    });
    res.json({ success: true, message: "Admin seeded", adminId: admin.id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
