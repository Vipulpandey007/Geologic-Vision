const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const SIGNED_URL_EXPIRY = parseInt(process.env.AWS_S3_SIGNED_URL_EXPIRY) || 300; // 5 min

/**
 * Multer middleware for direct S3 upload (PDFs only)
 */
const uploadPdf = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    // No ACL - bucket is private by default
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const key = `pdfs/${uuidv4()}${ext}`;
      cb(null, key);
    },
    metadata: (req, file, cb) => {
      cb(null, { 
        uploadedBy: req.user?.id || 'unknown',
        originalName: file.originalname 
      });
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});

/**
 * Multer for course thumbnails (images)
 */
const uploadThumbnail = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const key = `thumbnails/${uuidv4()}${ext}`;
      cb(null, key);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp) are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/**
 * Generate a short-lived signed URL for private S3 object
 * @param {string} key - S3 object key
 * @param {number} expiresIn - seconds (default 5 min)
 */
async function generateSignedUrl(key, expiresIn = SIGNED_URL_EXPIRY) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: 'inline', // Render in browser, not download
    ResponseContentType: 'application/pdf',
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete an object from S3
 */
async function deleteS3Object(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return s3Client.send(command);
}

module.exports = { s3Client, uploadPdf, uploadThumbnail, generateSignedUrl, deleteS3Object };
