const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { getProductReviews, createReview, updateReview, deleteReview, approveReview } = require('../controllers/reviewController');

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.put('/:id/approve', protect, adminOnly, approveReview);

module.exports = router;
