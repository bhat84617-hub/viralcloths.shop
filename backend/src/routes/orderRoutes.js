const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { orderLimiter } = require('../middleware/rateLimiter');
const { createOrderValidation } = require('../validators/orderValidator');
const {
  createOrder, getOrders, getOrder, getOrderByNumber,
  updateOrderStatus, cancelOrder, requestReturn, getDashboardStats,
  getInvoice, processRefund
} = require('../controllers/orderController');

router.get('/stats', protect, adminOnly, getDashboardStats);
router.post('/', optionalAuth, orderLimiter, createOrderValidation, createOrder);
router.get('/', protect, getOrders);
router.get('/number/:number', getOrderByNumber);
router.get('/:id', protect, getOrder);
router.get('/:id/invoice', protect, getInvoice);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/return', protect, requestReturn);
router.put('/:id/refund', protect, adminOnly, processRefund);

module.exports = router;
