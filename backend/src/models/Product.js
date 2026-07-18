const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  color: { type: String, default: '' },
  colorHex: { type: String, default: '' },
  size: { type: String, default: '' },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '', maxlength: 300 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  images: [{ type: String }],
  thumbnail: { type: String, default: '' },
  icon: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: 0, min: 0 },
  costPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  taxRate: { type: Number, default: 0 },
  variants: [variantSchema],
  sizes: [String],
  colors: [String],
  features: [String],
  material: { type: String, default: '' },
  weight: { type: Number, default: 0 },
  dimensions: { type: String, default: '' },

  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },

  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isOnSale: { type: Boolean, default: false },
  isOutOfStock: { type: Boolean, default: false },

  tags: [String],
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },

  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  this.isOnSale = this.salePrice > 0 && this.salePrice < this.price;
  const totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  this.isOutOfStock = totalStock <= 0;
  if (!this.metaTitle) {
    this.metaTitle = `${this.name} - ViralClothes.Shop`;
  }
  if (!this.metaDescription) {
    const desc = this.shortDescription || this.description || `Shop ${this.name} at ViralClothes.Shop. Premium quality streetwear and fashion.`;
    this.metaDescription = desc.length > 160 ? desc.substring(0, 157) + '...' : desc;
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ rating: -1 });

module.exports = mongoose.model('Product', productSchema);
