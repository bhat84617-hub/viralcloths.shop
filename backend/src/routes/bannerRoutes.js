const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { getBanners, getBanner, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');

router.get('/', getBanners);
router.get('/:id', getBanner);
router.post('/', protect, adminOnly, createBanner);
router.put('/:id', protect, adminOnly, updateBanner);
router.delete('/:id', protect, adminOnly, deleteBanner);

module.exports = router;
