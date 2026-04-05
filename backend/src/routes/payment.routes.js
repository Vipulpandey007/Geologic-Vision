const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyPurchases, getPaymentHistory } = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/my-purchases', authenticate, getMyPurchases);
router.get('/history', authenticate, authorize('ADMIN'), getPaymentHistory);

module.exports = router;
