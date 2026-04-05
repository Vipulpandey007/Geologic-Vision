const { prisma } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { deleteS3Object } = require('../config/s3');

/**
 * GET /api/courses
 * Get all published courses (public)
 */
async function getAllCourses(req, res, next) {
  try {
    const { search, isFree } = req.query;

    const where = { isPublished: true };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (isFree !== undefined) where.isFree = isFree === 'true';

    const courses = await prisma.course.findMany({
      where,
      select: {
        id: true, title: true, description: true, price: true,
        isFree: true, thumbnail: true, createdAt: true,
        _count: { select: { chapters: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/:id
 * Get single course with chapters (auth required for paid content)
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
          orderBy: { order: 'asc' },
          include: {
            pdfs: {
              select: { id: true, title: true, order: true },
              orderBy: { order: 'asc' },
            }
          }
        }
      }
    });

    if (!course) throw new AppError('Course not found', 404);

    // Check if user has purchased this course
    let hasPurchased = course.isFree;
    if (userId && !hasPurchased) {
      const purchase = await prisma.purchase.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });
      hasPurchased = !!purchase;
    }
    if (req.user?.role === 'ADMIN') hasPurchased = true;

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
      throw new AppError('Title and description are required', 400);
    }

    const thumbnailKey = req.file?.key || null;

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : parseFloat(price),
        isFree: Boolean(isFree),
        thumbnail: thumbnailKey,
      }
    });

    res.status(201).json({ success: true, message: 'Course created', course });
  } catch (error) {
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
    if (!existing) throw new AppError('Course not found', 404);

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isFree !== undefined) updateData.isFree = Boolean(JSON.parse(isFree));
    if (isPublished !== undefined) updateData.isPublished = Boolean(JSON.parse(isPublished));
    if (req.file?.key) {
      updateData.thumbnail = req.file.key;
      // Delete old thumbnail
      if (existing.thumbnail) await deleteS3Object(existing.thumbnail).catch(() => {});
    }

    const course = await prisma.course.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Course updated', course });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/courses/:id  [ADMIN]
 * Delete course (cascades to chapters and PDFs)
 */
async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;

    // Get all PDFs for cleanup
    const pdfs = await prisma.pdf.findMany({
      where: { chapter: { courseId: id } },
      select: { fileKey: true },
    });

    // Delete course (cascade handles DB records)
    const course = await prisma.course.delete({ where: { id } });

    // Clean up S3 files
    if (course.thumbnail) await deleteS3Object(course.thumbnail).catch(() => {});
    for (const pdf of pdfs) {
      await deleteS3Object(pdf.fileKey).catch(() => {});
    }

    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/admin/all  [ADMIN]
 * Get all courses including unpublished
 */
async function getAllCoursesAdmin(req, res, next) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { chapters: true, purchases: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
}

module.exports = { 
  getAllCourses, getCourse, createCourse, updateCourse, 
  deleteCourse, getAllCoursesAdmin 
};
