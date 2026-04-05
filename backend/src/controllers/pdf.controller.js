const { prisma } = require("../config/database");
const {
  uploadToSupabase,
  generateSignedUrl,
  deleteFromSupabase,
  supabase,
} = require("../config/supabase");
const { AppError } = require("../middleware/errorHandler");

/**
 * POST /api/pdfs/upload/:chapterId  [ADMIN]
 */
async function uploadPdf(req, res, next) {
  try {
    const { chapterId } = req.params;
    const { title } = req.body;

    if (!req.file) throw new AppError("PDF file is required", 400);
    if (!title) throw new AppError("PDF title is required", 400);

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) throw new AppError("Chapter not found", 404);

    const fileKey = await uploadToSupabase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    const lastPdf = await prisma.pdf.findFirst({
      where: { chapterId },
      orderBy: { order: "desc" },
    });
    const order = (lastPdf?.order || 0) + 1;

    const pdf = await prisma.pdf.create({
      data: {
        chapterId,
        title: title.trim(),
        fileKey,
        fileSize: req.file.size,
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      pdf: {
        id: pdf.id,
        title: pdf.title,
        order: pdf.order,
        fileSize: pdf.fileSize,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pdfs/:id/view
 * Returns signed URL + watermark info
 */
async function getPdfSignedUrl(req, res, next) {
  try {
    const { id } = req.params;

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        chapter: {
          include: { course: { select: { id: true, isFree: true } } },
        },
      },
    });

    if (!pdf) throw new AppError("PDF not found", 404);

    await checkAccess(req.user, pdf);

    res.json({
      success: true,
      pdf: { id: pdf.id, title: pdf.title },
      watermark: {
        text: req.user.phone || req.user.email || "EduPlatform",
        userId: req.user.id,
      },
      expiresIn: 300,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/pdfs/:id/proxy
 * Streams PDF bytes from Supabase to browser
 * This avoids CORS issues — browser never talks to Supabase directly
 */
async function proxyPdf(req, res, next) {
  try {
    const { id } = req.params;

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        chapter: {
          include: { course: { select: { id: true, isFree: true } } },
        },
      },
    });

    if (!pdf) throw new AppError("PDF not found", 404);

    await checkAccess(req.user, pdf);

    // Download from Supabase Storage
    const BUCKET = process.env.SUPABASE_BUCKET || "pdfs";
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(pdf.fileKey);

    if (error) throw new AppError(`Failed to fetch PDF: ${error.message}`, 500);

    // Convert Blob to Buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream to browser as PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", buffer.length);
    // Prevent download — render inline only
    res.setHeader("Content-Disposition", "inline");
    // No caching — always re-validate access
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Shared access check helper
 */
async function checkAccess(user, pdf) {
  const courseId = pdf.chapter.course.id;

  if (user.role === "ADMIN") return; // admins always have access
  if (pdf.chapter.course.isFree) return; // free courses always accessible

  const purchase = await prisma.purchase.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });

  if (!purchase)
    throw new AppError("Purchase required to view this content", 403);
  if (purchase.expiryDate && purchase.expiryDate < new Date()) {
    throw new AppError("Your access to this course has expired", 403);
  }
}

/**
 * DELETE /api/pdfs/:id  [ADMIN]
 */
async function deletePdf(req, res, next) {
  try {
    const { id } = req.params;
    const pdf = await prisma.pdf.findUnique({ where: { id } });
    if (!pdf) throw new AppError("PDF not found", 404);

    await prisma.pdf.delete({ where: { id } });
    await deleteFromSupabase(pdf.fileKey);

    res.json({ success: true, message: "PDF deleted" });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/pdfs/:id  [ADMIN]
 */
async function updatePdf(req, res, next) {
  try {
    const { id } = req.params;
    const { title, order } = req.body;
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (order !== undefined) updateData.order = parseInt(order);
    const pdf = await prisma.pdf.update({ where: { id }, data: updateData });
    res.json({ success: true, message: "PDF updated", pdf });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadPdf, getPdfSignedUrl, proxyPdf, deletePdf, updatePdf };
