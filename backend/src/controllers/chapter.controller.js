const { prisma } = require("../config/database");
const { AppError } = require("../middleware/errorHandler");

/**
 * GET /api/chapters/:courseId  [authenticated + purchase check]
 * Get all chapters for a course
 */
async function getChaptersByCourse(req, res, next) {
  try {
    const { courseId } = req.params;

    const chapters = await prisma.chapter.findMany({
      where: { courseId, isPublished: true },
      include: {
        pdfs: {
          select: { id: true, title: true, order: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    res.json({ success: true, chapters });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chapters  [ADMIN]
 * Create a chapter in a course
 */
async function createChapter(req, res, next) {
  try {
    const { courseId, title, description } = req.body;
    if (!courseId || !title)
      throw new AppError("Course ID and title are required", 400);

    // Check course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError("Course not found", 404);

    // Auto-assign order
    const lastChapter = await prisma.chapter.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });
    const order = (lastChapter?.order || 0) + 1;

    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        title: title.trim(),
        description: description?.trim(),
        order,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Chapter created", chapter });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/chapters/:id  [ADMIN]
 * Update chapter
 */
async function updateChapter(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, order, isPublished } = req.body;

    const existing = await prisma.chapter.findUnique({ where: { id } });
    if (!existing) throw new AppError("Chapter not found", 404);

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (order !== undefined) updateData.order = parseInt(order);
    if (isPublished !== undefined)
      updateData.isPublished = Boolean(JSON.parse(isPublished));

    const chapter = await prisma.chapter.update({
      where: { id },
      data: updateData,
    });
    res.json({ success: true, message: "Chapter updated", chapter });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/chapters/:id  [ADMIN]
 */
async function deleteChapter(req, res, next) {
  try {
    const { id } = req.params;
    const { deleteFromSupabase } = require("../config/supabase");

    // Get all PDFs for cleanup
    const pdfs = await prisma.pdf.findMany({
      where: { chapterId: id },
      select: { fileKey: true },
    });

    await prisma.chapter.delete({ where: { id } });

    // Cleanup S3
    for (const pdf of pdfs) {
      await deleteFromSupabase(pdf.fileKey).catch(() => {});
    }

    res.json({ success: true, message: "Chapter deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/chapters/reorder  [ADMIN]
 * Reorder chapters
 */
async function reorderChapters(req, res, next) {
  try {
    const { chapters } = req.body; // [{ id, order }]
    if (!Array.isArray(chapters))
      throw new AppError("chapters array is required", 400);

    await prisma.$transaction(
      chapters.map(({ id, order }) =>
        prisma.chapter.update({
          where: { id },
          data: { order: parseInt(order) },
        }),
      ),
    );

    res.json({ success: true, message: "Chapters reordered" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getChaptersByCourse,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
};
