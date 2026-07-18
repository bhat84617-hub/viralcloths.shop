const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  link: { type: String, default: '' },
  btnText: { type: String, default: 'Shop Now' },
  position: { type: String, enum: ['hero', 'featured', 'sidebar', 'bottom'], default: 'hero' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  startsAt: { type: Date },
  expiresAt: { type: Date }
}, { timestamps: true });

bannerSchema.index({ position: 1, sortOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
