const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { categoryValidation } = require('../validators/productValidator');
const {
  getCategories, getCategory, getCategoryBySlug,
  createCategory, updateCategory, deleteCategory
} = require('../controllers/categoryController');

router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);
router.post('/', protect, adminOnly, categoryValidation, createCategory);
router.put('/:id', protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
