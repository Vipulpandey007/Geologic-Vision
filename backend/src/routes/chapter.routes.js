const express = require('express');
const router = express.Router();
const {
  getChaptersByCourse,
  createChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
} = require('../controllers/chapter.controller');
const { authenticate, authorize, requirePurchase } = require('../middleware/auth.middleware');

// Student - requires auth + purchase
router.get('/course/:courseId', authenticate, requirePurchase, getChaptersByCourse);

// Admin
router.post('/', authenticate, authorize('ADMIN'), createChapter);
router.put('/:id', authenticate, authorize('ADMIN'), updateChapter);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteChapter);
router.patch('/reorder', authenticate, authorize('ADMIN'), reorderChapters);

module.exports = router;
