const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  image: { type: String, default: '' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  sku: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestEmail: { type: String, default: '' },
  isGuest: { type: Boolean, default: false },

  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  giftCardDiscount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  giftCardCode: { type: String, default: '' },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },

  customerInfo: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' }
  },

  shippingAddress: {
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    street: { type: String, required: true },
    apartment: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'US' }
  },

  paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'apple_pay', 'stripe', 'razorpay', 'cod'], default: 'credit_card' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending' },
  paymentId: { type: String, default: '' },
  paypalOrderId: { type: String, default: '' },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'],
    default: 'pending'
  },
  shippingMethod: { type: String, default: 'standard' },
  shippingMethodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShippingMethod' },
  shippingMethodName: { type: String, default: 'Standard Shipping' },
  trackingNumber: { type: String, default: '' },
  trackingUrl: { type: String, default: '' },
  carrier: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },

  notes: { type: String, default: '' },
  invoiceUrl: { type: String, default: '' },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },

  statusHistory: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `VC-${ts}-${rand}`;
  }
  next();
});

orderSchema.index({ user: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
