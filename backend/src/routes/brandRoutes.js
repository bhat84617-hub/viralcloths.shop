const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { brandValidation } = require('../validators/productValidator');
const { getBrands, getBrand, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');

router.get('/', getBrands);
router.get('/:id', getBrand);
router.post('/', protect, adminOnly, brandValidation, createBrand);
router.put('/:id', protect, adminOnly, updateBrand);
router.delete('/:id', protect, adminOnly, deleteBrand);

module.exports = router;
