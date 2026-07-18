const { body } = require('express-validator');

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().trim(),
  body('salePrice').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('isFeatured').optional().isBoolean(),
  body('isActive').optional().isBoolean()
];

const categoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required')
];

const brandValidation = [
  body('name').trim().notEmpty().withMessage('Brand name is required')
];

module.exports = { productValidation, categoryValidation, brandValidation };
