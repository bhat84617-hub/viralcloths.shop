const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['string', 'number', 'boolean', 'json', 'array'], default: 'string' },
  group: { type: String, default: 'general' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
