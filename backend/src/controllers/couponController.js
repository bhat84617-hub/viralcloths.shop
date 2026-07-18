const Coupon = require('../models/Coupon');

const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: coupons.length, total, totalPages: Math.ceil(total / parseInt(limit)), coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (!coupon) return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount is $${coupon.minOrderAmount}` });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }
    const discount = coupon.type === 'percentage'
      ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity)
      : coupon.value;
    res.json({ success: true, coupon, discount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCoupons, getCoupon, validateCoupon, createCoupon, updateCoupon, deleteCoupon };
