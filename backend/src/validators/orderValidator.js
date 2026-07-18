const { body } = require('express-validator');

const createOrderValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.email').trim().isEmail().withMessage('Valid email is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.zip').trim().notEmpty().withMessage('ZIP code is required'),
  body('paymentMethod').isIn(['credit_card', 'paypal', 'apple_pay', 'stripe', 'razorpay', 'cod']).withMessage('Valid payment method required')
];

const couponValidation = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be positive'),
  body('expiresAt').isISO8601().withMessage('Valid expiry date is required')
];

module.exports = { createOrderValidation, couponValidation };
