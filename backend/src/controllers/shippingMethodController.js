const ShippingMethod = require('../models/ShippingMethod');

exports.getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, methods });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find().sort('sortOrder');
    res.json({ success: true, methods });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.create(req.body);
    res.status(201).json({ success: true, method });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!method) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    res.json({ success: true, method });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    res.json({ success: true, message: 'Shipping method deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calculateShipping = async (req, res) => {
  try {
    const { subtotal, country } = req.body;
    const methods = await ShippingMethod.find({ isActive: true, restrictedCountries: { $in: [country, 'ALL'] } }).sort('sortOrder');
    const calculated = methods.map(m => ({
      ...m.toObject(),
      finalPrice: subtotal >= m.freeThreshold && m.freeThreshold > 0 ? 0 : m.price
    }));
    res.json({ success: true, methods: calculated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
