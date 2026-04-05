const express = require("express");
const router = express.Router();
const {
  uploadPdf,
  getPdfSignedUrl,
  proxyPdf,
  deletePdf,
  updatePdf,
} = require("../controllers/pdf.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { uploadPdf: uploadPdfMiddleware } = require("../config/s3");

// View PDF — returns signed URL info
router.get("/:id/view", authenticate, getPdfSignedUrl);

// Proxy PDF — streams PDF bytes to browser (avoids CORS with Supabase)
router.get("/:id/proxy", authenticate, proxyPdf);

// Admin only
router.post(
  "/upload/:chapterId",
  authenticate,
  authorize("ADMIN"),
  uploadPdfMiddleware.single("pdf"),
  uploadPdf,
);
router.put("/:id", authenticate, authorize("ADMIN"), updatePdf);
router.delete("/:id", authenticate, authorize("ADMIN"), deletePdf);

module.exports = router;
