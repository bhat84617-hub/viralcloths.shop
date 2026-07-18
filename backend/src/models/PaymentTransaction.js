const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestEmail: { type: String, default: '' },

  gateway: { type: String, required: true, enum: ['stripe', 'paypal', 'razorpay'] },
  transactionId: { type: String, default: '' },
  gatewayOrderId: { type: String, default: '' },

  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  refundAmount: { type: Number, default: 0 },
  refundId: { type: String, default: '' },

  customerCountry: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },

  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },

  errorMessage: { type: String, default: '' },
  errorCode: { type: String, default: '' }
}, { timestamps: true });

paymentTransactionSchema.index({ transactionId: 1 });
paymentTransactionSchema.index({ order: 1 });
paymentTransactionSchema.index({ gateway: 1, status: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
