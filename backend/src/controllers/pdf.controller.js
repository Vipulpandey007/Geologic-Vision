const { prisma } = require('../config/database');
const { generateSignedUrl, deleteS3Object } = require('../config/s3');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/pdfs/upload/:chapterId  [ADMIN]
 * Upload PDF to S3 and save record in DB
 */
async function uploadPdf(req, res, next) {
  try {
    const { chapterId } = req.params;
    const { title } = req.body;

    if (!req.file) throw new AppError('PDF file is required', 400);
    if (!title) throw new AppError('PDF title is required', 400);

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw new AppError('Chapter not found', 404);

    // Auto-order
    const lastPdf = await prisma.pdf.findFirst({
      where: { chapterId },
      orderBy: { order: 'desc' },
    });
    const order = (lastPdf?.order || 0) + 1;

    const pdf = await prisma.pdf.create({
      data: {
        chapterId,
        title: title.trim(),
        fileKey: req.file.key, // S3 key from multer-s3
        fileSize: req.file.size,
        order,
      }
    });

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      pdf: {
        id: pdf.id,
        title: pdf.title,
        order: pdf.order,
        fileSize: pdf.fileSize,
      }
    });
  } catch (error) {
    // If DB save fails, delete from S3
    if (req.file?.key) {
      await deleteS3Object(req.file.key).catch(() => {});
    }
    next(error);
  }
}

/**
 * GET /api/pdfs/:id/view
 * Get a secure signed URL for viewing a PDF
 * Only accessible to users who purchased the course (middleware handles this)
 */
async function getPdfSignedUrl(req, res, next) {
  try {
    const { id } = req.params;

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        chapter: {
          include: { course: { select: { id: true, isFree: true } } }
        }
      }
    });

    if (!pdf) throw new AppError('PDF not found', 404);

    const courseId = pdf.chapter.course.id;
    const userId = req.user.id;

    // Access check: free course OR purchased OR admin
    if (!pdf.chapter.course.isFree && req.user.role !== 'ADMIN') {
      const purchase = await prisma.purchase.findUnique({
        where: { userId_courseId: { userId, courseId } }
      });

      if (!purchase) {
        throw new AppError('Purchase required to view this content', 403);
      }

      if (purchase.expiryDate && purchase.expiryDate < new Date()) {
        throw new AppError('Your access to this course has expired', 403);
      }
    }

    // Generate signed URL (5 min expiry)
    const signedUrl = await generateSignedUrl(pdf.fileKey);

    // Return URL with user watermark info (not directly embedded here - done in frontend PDF.js)
    res.json({
      success: true,
      signedUrl,
      watermark: {
        text: req.user.phone || req.user.email,
        userId: req.user.id,
      },
      pdf: {
        id: pdf.id,
        title: pdf.title,
      },
      expiresIn: parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY) || 300,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/pdfs/:id  [ADMIN]
 * Delete a PDF
 */
async function deletePdf(req, res, next) {
  try {
    const { id } = req.params;

    const pdf = await prisma.pdf.findUnique({ where: { id } });
    if (!pdf) throw new AppError('PDF not found', 404);

    await prisma.pdf.delete({ where: { id } });
    await deleteS3Object(pdf.fileKey).catch(() => {});

    res.json({ success: true, message: 'PDF deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/pdfs/:id  [ADMIN]
 * Update PDF metadata (title, order)
 */
async function updatePdf(req, res, next) {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (order !== undefined) updateData.order = parseInt(order);

    const pdf = await prisma.pdf.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'PDF updated', pdf });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadPdf, getPdfSignedUrl, deletePdf, updatePdf };
