const crypto = require('crypto');
const BaseGateway = require('./BaseGateway');

class RazorpayGateway extends BaseGateway {
  constructor() {
    super();
    this.name = 'razorpay';
    this.displayName = 'Razorpay (India)';
    this.countries = ['IN']; // Only available for India
    this.isActive = true;
    this.razorpay = null;
  }

  _getRazorpay() {
    if (!this.razorpay) {
      const Razorpay = require('razorpay');
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    }
    return this.razorpay;
  }

  async createPayment(orderData) {
    const { total, currency = 'INR' } = orderData;
    const razorpay = this._getRazorpay();
    const amountInPaise = Math.round(total * 100);
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1
    };
    const order = await razorpay.orders.create(options);
    return {
      success: true,
      gateway: this.name,
      transactionId: order.id,
      razorpayOrderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      metadata: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    };
  }

  async confirmPayment(paymentData) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return { success: false, status: 'failed', gateway: this.name, error: 'Missing Razorpay verification params' };
    }
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expectedSignature !== razorpaySignature) {
      return { success: false, status: 'failed', gateway: this.name, error: 'Invalid Razorpay signature' };
    }
    return {
      success: true,
      status: 'completed',
      transactionId: razorpayPaymentId,
      gateway: this.name,
      orderId: razorpayOrderId,
      metadata: { razorpayPaymentId, razorpayOrderId }
    };
  }

  async processRefund(transaction, amount) {
    const razorpay = this._getRazorpay();
    try {
      const paymentId = transaction.metadata?.razorpayPaymentId || transaction.transactionId;
      if (transaction.status !== 'completed') {
        return { success: false, error: 'Cannot refund: transaction not completed' };
      }
      const refund = await razorpay.payments.refund(paymentId, {
        amount: amount ? Math.round(amount * 100) : undefined
      });
      return { success: true, refundId: refund.id, amount: refund.amount / 100, status: refund.status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async verifyWebhook(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (expectedSignature !== signature) {
      return { success: false, error: 'Invalid webhook signature' };
    }
    return { success: true, event: payload };
  }

  getClientConfig() {
    return {
      ...super.getClientConfig(),
      keyId: process.env.RAZORPAY_KEY_ID || '',
      currency: 'INR'
    };
  }
}

module.exports = RazorpayGateway;
