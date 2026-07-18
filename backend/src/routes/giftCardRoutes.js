const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const ctrl = require('../controllers/giftCardController');

router.post('/validate', ctrl.validateGiftCard);
router.get('/my', protect, ctrl.getMyGiftCards);
router.get('/', protect, adminOnly, ctrl.getAllGiftCards);
router.get('/:id', protect, adminOnly, ctrl.getGiftCard);
router.post('/', protect, adminOnly, ctrl.createGiftCard);
router.put('/:id', protect, adminOnly, ctrl.updateGiftCard);
router.delete('/:id', protect, adminOnly, ctrl.deleteGiftCard);

module.exports = router;
