const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  originalBalance: { type: Number, required: true, min: 1 },
  balance: { type: Number, required: true, min: 0 },
  recipientEmail: { type: String, default: '' },
  senderName: { type: String, default: '' },
  message: { type: String, default: '', maxlength: 500 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
}, { timestamps: true });

giftCardSchema.index({ isActive: 1, expiresAt: 1 });

module.exports = mongoose.model('GiftCard', giftCardSchema);
