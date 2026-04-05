const { prisma } = require("../config/database");
const { AppError } = require("../middleware/errorHandler");
const { deleteFromSupabase } = require("../config/supabase");
const path = require("path");
const fs = require("fs");

/**
 * GET /api/courses
 * Get all published courses (public)
 */
async function getAllCourses(req, res, next) {
  try {
    const { search, isFree } = req.query;
    const where = { isPublished: true };
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (isFree !== undefined) where.isFree = isFree === "true";

    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        isFree: true,
        thumbnail: true,
        createdAt: true,
        _count: { select: { chapters: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/:id
 * Get single course with chapters
 */
async function getCourse(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const course = await prisma.course.findUnique({
      where: { id, isPublished: true },
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
          include: {
            pdfs: {
              select: { id: true, title: true, order: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!course) throw new AppError("Course not found", 404);

    let hasPurchased = course.isFree;
    if (userId && !hasPurchased) {
      const purchase = await prisma.purchase.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });
      hasPurchased = !!purchase;
    }
    if (req.user?.role === "ADMIN") hasPurchased = true;

    res.json({ success: true, course, hasPurchased });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/courses  [ADMIN]
 * Create a new course
 */
async function createCourse(req, res, next) {
  try {
    const { title, description, price = 0, isFree = false } = req.body;

    if (!title || !description) {
      throw new AppError("Title and description are required", 400);
    }

    // req.file.filename for local disk storage (thumbnail)
    const thumbnailPath = req.file
      ? `/uploads/thumbnails/${req.file.filename}`
      : null;

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: isFree === "true" || isFree === true ? 0 : parseFloat(price),
        isFree: isFree === "true" || isFree === true,
        thumbnail: thumbnailPath,
      },
    });

    res.status(201).json({ success: true, message: "Course created", course });
  } catch (error) {
    // Clean up uploaded file if DB save fails
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
}

/**
 * PUT /api/courses/:id  [ADMIN]
 * Update course
 */
async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, price, isFree, isPublished } = req.body;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) throw new AppError("Course not found", 404);

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isFree !== undefined)
      updateData.isFree = isFree === "true" || isFree === true;
    if (isPublished !== undefined)
      updateData.isPublished = isPublished === "true" || isPublished === true;

    // New thumbnail uploaded
    if (req.file) {
      updateData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      // Delete old thumbnail file if it existed
      if (existing.thumbnail) {
        const oldPath = path.join(process.cwd(), "public", existing.thumbnail);
        fs.unlink(oldPath, () => {});
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, message: "Course updated", course });
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
}

/**
 * DELETE /api/courses/:id  [ADMIN]
 */
async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: { chapters: { include: { pdfs: true } } },
    });
    if (!course) throw new AppError("Course not found", 404);

    // Collect all PDF S3 keys for cleanup
    const pdfKeys = course.chapters.flatMap((ch) =>
      ch.pdfs.map((p) => p.fileKey),
    );

    // Delete from DB (cascade handles chapters + pdfs)
    await prisma.course.delete({ where: { id } });

    // Clean up thumbnail (local file)
    if (course.thumbnail) {
      const thumbPath = path.join(process.cwd(), "public", course.thumbnail);
      fs.unlink(thumbPath, () => {});
    }

    // Clean up PDFs from S3
    for (const key of pdfKeys) {
      await deleteFromSupabase(key).catch(() => {});
    }

    res.json({ success: true, message: "Course deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/admin/all  [ADMIN]
 */
async function getAllCoursesAdmin(req, res, next) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { chapters: true, purchases: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
};
