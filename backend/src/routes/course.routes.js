const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCoursesAdmin,
} = require('../controllers/course.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadThumbnail } = require('../config/s3');

// Public
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Admin only
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllCoursesAdmin);
router.post('/', authenticate, authorize('ADMIN'), uploadThumbnail.single('thumbnail'), createCourse);
router.put('/:id', authenticate, authorize('ADMIN'), uploadThumbnail.single('thumbnail'), updateCourse);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCourse);

module.exports = router;
