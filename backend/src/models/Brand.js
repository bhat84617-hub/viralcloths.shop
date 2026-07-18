const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Brand name is required'], trim: true, unique: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

brandSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
