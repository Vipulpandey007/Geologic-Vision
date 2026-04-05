const express = require('express');
const router = express.Router();
const { uploadPdf, getPdfSignedUrl, deletePdf, updatePdf } = require('../controllers/pdf.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadPdf: uploadPdfMiddleware } = require('../config/s3');

// View PDF (signed URL) - auth required, purchase check in controller
router.get('/:id/view', authenticate, getPdfSignedUrl);

// Admin only
router.post('/upload/:chapterId', authenticate, authorize('ADMIN'), uploadPdfMiddleware.single('pdf'), uploadPdf);
router.put('/:id', authenticate, authorize('ADMIN'), updatePdf);
router.delete('/:id', authenticate, authorize('ADMIN'), deletePdf);

module.exports = router;
