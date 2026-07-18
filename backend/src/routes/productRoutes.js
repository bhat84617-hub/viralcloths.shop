const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { productValidation } = require('../validators/productValidator');
const {
  getProducts, getProduct, getProductBySlug,
  createProduct, updateProduct, deleteProduct,
  getFeaturedProducts, getBestSellers, getNewArrivals, getTrendingProducts,
  getRelatedProducts, searchProducts
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/trending', getTrendingProducts);
router.get('/search', searchProducts);
router.get('/related/:id', getRelatedProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);
router.post('/', protect, adminOnly, productValidation, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
