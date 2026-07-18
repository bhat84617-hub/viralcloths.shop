const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  freeThreshold: { type: Number, default: 0 },
  estimatedDays: { type: String, default: '3-7 business days' },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  restrictedCountries: [String]
}, { timestamps: true });

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
