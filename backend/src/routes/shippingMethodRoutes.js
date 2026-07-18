const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const ctrl = require('../controllers/shippingMethodController');

router.get('/', ctrl.getShippingMethods);
router.get('/all', protect, adminOnly, ctrl.getAllShippingMethods);
router.post('/', protect, adminOnly, ctrl.createShippingMethod);
router.post('/calculate', ctrl.calculateShipping);
router.put('/:id', protect, adminOnly, ctrl.updateShippingMethod);
router.delete('/:id', protect, adminOnly, ctrl.deleteShippingMethod);

module.exports = router;
