const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  initiatePayment, completePayment, createRazorpayOrder, confirmRazorpayPayment,
  getAvailableGateways, processRefund, getPaymentHistory, getPaymentTransaction,
  createPaymentIntent, confirmPayment, createPayPalOrder, capturePayPalOrder, stripeWebhook
} = require('../controllers/paymentController');

// Public: get available gateways for a country
router.get('/gateways', getAvailableGateways);

// Unified gateway-agnostic payment flow
router.post('/initiate', optionalAuth, apiLimiter, initiatePayment);
router.post('/complete', optionalAuth, apiLimiter, completePayment);

// Razorpay (India-specific)
router.post('/razorpay/create-order', optionalAuth, apiLimiter, createRazorpayOrder);
router.post('/razorpay/confirm', optionalAuth, apiLimiter, confirmRazorpayPayment);

// Legacy Stripe endpoints (kept for backward compatibility)
router.post('/create-intent', protect, apiLimiter, createPaymentIntent);
router.post('/confirm', protect, apiLimiter, confirmPayment);
router.post('/paypal/create', protect, apiLimiter, createPayPalOrder);
router.post('/paypal/capture', protect, apiLimiter, capturePayPalOrder);

// Webhooks (raw body handled in server.js per gateway - not duplicated here)

// Stripe key (public)
router.get('/stripe-key', (req, res) => res.json({ key: process.env.STRIPE_PUBLISHABLE_KEY || '' }));

// Refund & history (admin)
router.post('/refund', protect, adminOnly, apiLimiter, processRefund);
router.get('/history', protect, adminOnly, getPaymentHistory);
router.get('/history/:id', protect, adminOnly, getPaymentTransaction);

module.exports = router;
