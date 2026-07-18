const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { getCoupons, getCoupon, validateCoupon, createCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');

router.post('/validate', optionalAuth, validateCoupon);
router.get('/', protect, adminOnly, getCoupons);
router.get('/:id', protect, adminOnly, getCoupon);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
