const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

// ─── Thumbnail Upload (local disk) ────────────────────────────────────────────
const thumbnailDir = path.join(
  process.cwd(),
  "public",
  "uploads",
  "thumbnails",
);
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

const uploadThumbnail = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, thumbnailDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed"), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ─── PDF Upload (memory storage → then sent to Supabase in controller) ────────
// We use memoryStorage so the file buffer is available in req.file.buffer
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = { uploadThumbnail, uploadPdf };
