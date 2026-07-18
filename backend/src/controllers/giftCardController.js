const GiftCard = require('../models/GiftCard');
const crypto = require('crypto');

exports.validateGiftCard = async (req, res) => {
  try {
    const { code } = req.body;
    const gc = await GiftCard.findOne({
      code: code.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }]
    });
    if (!gc) return res.status(404).json({ success: false, message: 'Invalid or expired gift card' });
    if (gc.balance <= 0) return res.status(400).json({ success: false, message: 'Gift card has no remaining balance' });
    res.json({ success: true, giftCard: { code: gc.code, balance: gc.balance, expiresAt: gc.expiresAt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createGiftCard = async (req, res) => {
  try {
    const code = 'GC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const gc = await GiftCard.create({ ...req.body, code });
    res.status(201).json({ success: true, giftCard: gc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllGiftCards = async (req, res) => {
  try {
    const giftCards = await GiftCard.find().sort('-createdAt');
    res.json({ success: true, giftCards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getGiftCard = async (req, res) => {
  try {
    const gc = await GiftCard.findById(req.params.id);
    if (!gc) return res.status(404).json({ success: false, message: 'Gift card not found' });
    res.json({ success: true, giftCard: gc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateGiftCard = async (req, res) => {
  try {
    const gc = await GiftCard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!gc) return res.status(404).json({ success: false, message: 'Gift card not found' });
    res.json({ success: true, giftCard: gc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteGiftCard = async (req, res) => {
  try {
    await GiftCard.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gift card deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyGiftCards = async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ usedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, giftCards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
